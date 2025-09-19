/* =========================
 * src/app/core/api.service.ts
 * ========================= */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import * as signalR from '@microsoft/signalr';

/* ===== Tipos ===== */
export interface EquipoMini { id: number; nombre: string; abreviatura?: string; color?: string; }
export interface Marcador   { partidoId: number; local: number; visitante: number; }
export interface CuartoDto  { id: number; numero: number; esProrroga: boolean; duracionSegundos: number; segundosRestantes: number; estado: string; }
export interface EstadoPartido {
  partidoId: number;
  estado: string;
  local: EquipoMini;
  visitante: EquipoMini;
  marcador: Marcador;
  cuartoActual?: CuartoDto | null;
  faltasLocal: number;
  faltasVisitante: number;
}
export type TimerPhase = 'running' | 'paused' | 'stopped' | 'finished';
export interface TimerState {
  phase: TimerPhase;
  durationSec: number;
  startedAtUnixMs?: number;
  remainingSec?: number;
}
export interface PeriodState {
  numero: number;
  total:  number;
  esProrroga: boolean;
  rotulo?: 'Descanso' | 'Medio tiempo' | null;
}
export interface TeamsState {
  local:     EquipoMini | null;
  visitante: EquipoMini | null;
}

/* ===== Faltas DTOs ===== */
export interface PlayerFouls { jugadorId: number; dorsal?: number; nombre: string; posicion?: string; faltas: number; }
export interface TeamFouls   { equipoId: number; equipoNombre?: string; jugadores: PlayerFouls[]; fuera5: PlayerFouls[]; totalEquipo: number; }
export interface FoulsState  { partidoId: number; local: TeamFouls; visitante: TeamFouls; }

/* ===== Tiempos muertos DTOs ===== */
export interface TeamTimeouts { equipoId: number; equipoNombre?: string; cortos: number; largos: number; total: number; }
export interface TimeoutsState { partidoId: number; local: TeamTimeouts; visitante: TeamTimeouts; }

/* ===== Respuesta backend /api/partidos/start ===== */
export interface StartPartidoResponse {
  partidoId: number;
  estado: string;
  local:  { id: number; nombre: string; abreviatura?: string; color?: string; };
  visitante: { id: number; nombre: string; abreviatura?: string; color?: string; };
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly api = environment.apiBase;
  private hub?: signalR.HubConnection;

  /* ===== Claves de storage ===== */
  private readonly K_PARTIDO = 'mb_partido_v1';
  private readonly K_PERIOD   = 'mb_period_v1';
  private readonly K_TIMER    = 'mb_timer_v1';
  private readonly K_SCORE    = 'mb_score_v1';
  private readonly K_SOUND    = 'mb_sound_v1';
  private readonly K_TEAMS    = 'mb_teams_v1';
  private readonly K_FOULS    = 'mb_fouls_v1';
  private readonly K_TIMEOUTS = 'mb_timeouts_v1';

  /* ===== Streams ===== */
  partidoId$ = new BehaviorSubject<number | null>(null);
  estado$    = new BehaviorSubject<EstadoPartido | null>(null);
  msg$       = new BehaviorSubject<string>('...');

  score$   = new BehaviorSubject<Marcador>({ partidoId: 0, local: 0, visitante: 0 });
  timer$   = new BehaviorSubject<TimerState>({ phase: 'stopped', durationSec: 600, remainingSec: 600 });
  period$  = new BehaviorSubject<PeriodState>({ numero: 1, total: 4, esProrroga: false, rotulo: null });
  teams$   = new BehaviorSubject<TeamsState>({ local: null, visitante: null });

  fouls$    = new BehaviorSubject<FoulsState>(this.emptyFouls());
  timeouts$ = new BehaviorSubject<TimeoutsState>(this.emptyTimeouts());

  soundEnabled$ = new BehaviorSubject<boolean>(true);

  /* ===== Audio ===== */
  private audioCtx?: AudioContext;
  private ensureCtx() {
    if (!this.audioCtx) {
      const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AC();
    }
  }
  private async tone(freq = 880, ms = 220) {
    this.ensureCtx();
    const ctx = this.audioCtx!;
    if (ctx.state === 'suspended') { try { await ctx.resume(); } catch {} }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    osc.start();
    const tEnd = ctx.currentTime + ms / 1000;
    gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);
    osc.stop(tEnd);
    return new Promise<void>(r => setTimeout(r, ms));
  }
  async playStart(force = false) { if (!force && !this.soundEnabled$.value) return; await this.tone(880, 150); await this.tone(1320, 170); }
  async playEnd(force = false)   { if (!force && !this.soundEnabled$.value) return; await this.tone(660, 200); await this.tone(440, 260); }
  async playTest() { await this.playStart(true); await this.playEnd(true); }

  constructor(private http: HttpClient) {
    /* Restaurar desde localStorage */
    try {
      const pid = localStorage.getItem(this.K_PARTIDO);
      if (pid) this.partidoId$.next(Number(pid));

      const p = localStorage.getItem(this.K_PERIOD);
      if (p) this.period$.next(JSON.parse(p));
      const t = localStorage.getItem(this.K_TIMER);
      if (t) this.timer$.next(JSON.parse(t));
      const s = localStorage.getItem(this.K_SCORE);
      if (s) this.score$.next(JSON.parse(s));
      const tm = localStorage.getItem(this.K_TEAMS);
      if (tm) this.teams$.next(JSON.parse(tm));
      const f = localStorage.getItem(this.K_FOULS);
      if (f) this.fouls$.next(JSON.parse(f));
      const to = localStorage.getItem(this.K_TIMEOUTS);
      if (to) this.timeouts$.next(JSON.parse(to));
      const snd = localStorage.getItem(this.K_SOUND);
      if (snd != null) this.soundEnabled$.next(snd === '1');
    } catch {}

    /* Guardar cambios */
    this.partidoId$.subscribe(v => { try { v==null ? localStorage.removeItem(this.K_PARTIDO) : localStorage.setItem(this.K_PARTIDO, String(v)); } catch {} });
    this.period$.subscribe(v   => { try { localStorage.setItem(this.K_PERIOD,   JSON.stringify(v)); } catch {} });
    this.timer$.subscribe(v    => { try { localStorage.setItem(this.K_TIMER,    JSON.stringify(v)); } catch {} });
    this.score$.subscribe(v    => { try { localStorage.setItem(this.K_SCORE,    JSON.stringify(v)); } catch {} });
    this.teams$.subscribe(v    => { try { localStorage.setItem(this.K_TEAMS,    JSON.stringify(v)); } catch {} });
    this.fouls$.subscribe(v    => { try { localStorage.setItem(this.K_FOULS,    JSON.stringify(v)); } catch {} });
    this.timeouts$.subscribe(v => { try { localStorage.setItem(this.K_TIMEOUTS, JSON.stringify(v)); } catch {} });
    this.soundEnabled$.subscribe(on => { try { localStorage.setItem(this.K_SOUND, on ? '1' : '0'); } catch {} });

    /* Sync multi-pestaña */
    window.addEventListener('storage', (e) => {
      if (e.key === this.K_PARTIDO) this.partidoId$.next(e.newValue ? Number(e.newValue) : null);
      if (e.key === this.K_PERIOD   && e.newValue) { try { this.period$.next(JSON.parse(e.newValue)); } catch {} }
      if (e.key === this.K_TIMER    && e.newValue) { try { this.timer$.next(JSON.parse(e.newValue)); } catch {} }
      if (e.key === this.K_SCORE    && e.newValue) { try { this.score$.next(JSON.parse(e.newValue)); } catch {} }
      if (e.key === this.K_TEAMS    && e.newValue) { try { this.teams$.next(JSON.parse(e.newValue)); } catch {} }
      if (e.key === this.K_FOULS    && e.newValue) { try { this.fouls$.next(JSON.parse(e.newValue)); } catch {} }
      if (e.key === this.K_TIMEOUTS && e.newValue) { try { this.timeouts$.next(JSON.parse(e.newValue)); } catch {} }
      if (e.key === this.K_SOUND    && e.newValue) { this.soundEnabled$.next(e.newValue === '1'); }
    });
  }

  /* ===== Helpers ===== */
  private emptyFouls(): FoulsState {
    return {
      partidoId: 0,
      local:     { equipoId: 0, equipoNombre: '', jugadores: [], fuera5: [], totalEquipo: 0 },
      visitante: { equipoId: 0, equipoNombre: '', jugadores: [], fuera5: [], totalEquipo: 0 },
    };
  }
  private emptyTimeouts(): TimeoutsState {
    return {
      partidoId: 0,
      local:     { equipoId: 0, equipoNombre: '', cortos: 0, largos: 0, total: 0 },
      visitante: { equipoId: 0, equipoNombre: '', cortos: 0, largos: 0, total: 0 },
    };
  }
  private hasPartido(): number | null {
    const id = this.partidoId$.value;
    return (id && id > 0) ? id : null;
  }

  setSoundEnabled(on: boolean) { this.soundEnabled$.next(on); }

  /* -------- Health ---------- */
  health() { return this.http.get(`${this.api}/healthz`); }

  /* -------- Crear/Reusar Partido ---------- */
  async startPartido(localId: number, visitId: number): Promise<number> {
    if (!localId || !visitId) throw new Error('Selecciona equipo Local y Visitante antes de iniciar.');
    if (localId === visitId)  throw new Error('No se puede iniciar: el equipo Local y Visitante no pueden ser el mismo. Elige equipos diferentes.');

    const resp = await firstValueFrom(
      this.http.post<StartPartidoResponse>(`${this.api}/api/partidos/start`, {
        equipoLocalId: localId,
        equipoVisitanteId: visitId
      })
    );
    const partidoId = resp.partidoId;
    this.partidoId$.next(partidoId);

    this.score$.next({ partidoId, local: 0, visitante: 0 });

    try { const f = await firstValueFrom(this.getFoulsResumen(partidoId)); this.fouls$.next(f); } catch {}
    try { const t = await firstValueFrom(this.getTimeoutsResumen(partidoId)); this.timeouts$.next(t); } catch {}

    return partidoId;
  }

  clearPartidoLocalState() {
    this.partidoId$.next(null);
    this.score$.next({ partidoId: 0, local: 0, visitante: 0 });
    this.fouls$.next(this.emptyFouls());
    this.timeouts$.next(this.emptyTimeouts());
    this.period$.next({ numero: 1, total: 4, esProrroga: false, rotulo: null });
    this.timer$.next({ phase: 'stopped', durationSec: 600, remainingSec: 600 });
    this.teams$.next({ local: null, visitante: null });
  }

  /* -------- SignalR ---------- */
  async connectHub() {
    if (this.hub) return;
    this.hub = new signalR.HubConnectionBuilder()
      .withUrl(`${this.api}/hub/marcador`)
      .withAutomaticReconnect()
      .build();

    this.hub.on('serverMessage', (text: string) => this.msg$.next(text));
    this.hub.on('stateUpdated', (estado) => this.estado$.next(estado));
    this.hub.on('scoreUpdated', (payload: Marcador) => {
      this.score$.next(payload);
      const prev = this.estado$.value;
      if (prev) this.estado$.next({ ...prev, marcador: payload });
    });
    this.hub.on('timerSync',    (state: TimerState) => this.timer$.next(state));
    this.hub.on('periodSync',   (p: PeriodState)   => this.period$.next(p));
    this.hub.on('teamsSync',    (t: TeamsState)    => this.teams$.next(t));
    this.hub.on('foulsSync',    (f: FoulsState)    => this.fouls$.next(f));
    this.hub.on('timeoutsSync', (t: TimeoutsState) => this.timeouts$.next(t));

    // 👉 NUEVO: cuando el server finaliza y anuncia, limpiar este cliente.
    this.hub.on('partidoCerrado', (_: any) => {
      this.clearPartidoLocalState();
    });

    await this.hub.start();

    try { await this.hub.invoke('TimerControl', this.timer$.value); } catch {}
    try { await this.hub.invoke('PeriodControl', this.period$.value); } catch {}
    try {
      const pid = this.hasPartido();
      if (pid) await this.hub.invoke('BroadcastScoreSimple', pid, this.score$.value.local, this.score$.value.visitante);
    } catch {}
    try { await this.hub.invoke('TeamsControl', this.teams$.value as any); } catch {}

    const pid = this.hasPartido();
    if (pid) {
      if (this.fouls$.value.local.jugadores.length === 0) {
        this.getFoulsResumen(pid).subscribe({ next: (f) => this.fouls$.next(f), error: () => {} });
      }
      if (this.timeouts$.value.local.total === 0 && this.timeouts$.value.visitante.total === 0) {
        this.getTimeoutsResumen(pid).subscribe({ next: (t) => this.timeouts$.next(t), error: () => {} });
      }
    }
  }

  /* ===== Marcador (DB) ===== */
  getMarcador(partidoId: number): Observable<Marcador> {
    return this.http.get<Marcador>(`${this.api}/api/partidos/${partidoId}/marcador`);
  }
  ajustarPuntos(
    partidoId: number,
    body: { equipoId: number; jugadorId?: number | null; puntos: -3 | -2 | -1 | 1 | 2 | 3; descripcion?: string; esCorreccion?: boolean }
  ): Observable<Marcador> {
    return this.http
      .post<Marcador>(`${this.api}/api/partidos/${partidoId}/anotaciones/ajustar`, body)
      .pipe(tap(m => this.score$.next(m)));
  }

  /* ===== Cronómetro: auditoría en BD ===== */
  private postCrono(tipo: 'inicio'|'pausa'|'reanudar'|'fin'|'prorroga'|'descanso'|'medio'|'reiniciar', segundos?: number | null) {
    const pid = this.hasPartido(); if (!pid) return;
    const p = this.period$.value;
    const payload: any = {
      tipo,
      segundosRestantes: (typeof segundos === 'number' ? Math.max(0, Math.floor(segundos)) : null),
      numeroCuarto: p.numero,
      esProrroga: !!p.esProrroga
    };
    this.http.post(`${this.api}/api/partidos/${pid}/cronometro/evento`, payload).subscribe({ next:()=>{}, error:()=>{} });
  }

  /* ===== Timer ===== */
  private async sendTimer(state: TimerState) {
    this.timer$.next(state);
    try { await this.hub?.invoke('TimerControl', state); } catch {}
  }

  quarterDurationSec(p: PeriodState): number {
    return p.esProrroga ? 5 * 60 : 10 * 60;
  }

  async timerStart(durationSec?: number) {
    const cur = this.timer$.value;
    const p   = this.period$.value;
    const now = Date.now();

    // Reanudar si estaba en pausa
    if (cur.phase === 'paused' && typeof cur.remainingSec === 'number') {
      const startedAt = now - (cur.durationSec - cur.remainingSec) * 1000;
      await this.sendTimer({ phase: 'running', durationSec: cur.durationSec, startedAtUnixMs: startedAt });
      this.postCrono('reanudar', this.computeRemainingNow({ ...cur, phase: 'running', durationSec: cur.durationSec, startedAtUnixMs: startedAt }));
      return;
    }

    // Nuevo inicio (cuarto / descanso / prórroga). NO tocar BD aquí.
    const dur = durationSec ?? cur.durationSec ?? 600;
    await this.sendTimer({ phase: 'running', durationSec: dur, startedAtUnixMs: now });

    // Auditar etiqueta
    if (p.rotulo === 'Medio tiempo') this.postCrono('medio', dur);
    else if (p.rotulo === 'Descanso') this.postCrono('descanso', dur);
    else if (p.esProrroga) this.postCrono('prorroga', dur);
    else this.postCrono('inicio', dur);
  }

  async timerPause() {
    const cur = this.timer$.value;
    const rem = this.computeRemainingNow(cur);
    await this.sendTimer({ phase: 'paused', durationSec: cur.durationSec, remainingSec: rem });
    this.postCrono('pausa', rem);
  }

  // ⛔ audit = false por defecto. Solo el botón Reiniciar manda audit = true.
  async timerReset(durationSec?: number, audit = false) {
    const cur = this.timer$.value;
    const dur = durationSec ?? cur.durationSec ?? 600;
    await this.sendTimer({ phase: 'stopped', durationSec: dur, remainingSec: dur });
    if (audit) this.postCrono('reiniciar', dur);
  }

  async timerFinish() {
    const cur = this.timer$.value;
    await this.sendTimer({ phase: 'finished', durationSec: cur.durationSec, remainingSec: 0 });
    this.postCrono('fin', 0);
  }

  async timerSet(durationSec: number) {
    await this.sendTimer({ phase: 'stopped', durationSec, remainingSec: durationSec });
  }

  computeRemainingNow(state: TimerState): number {
    const clamp = (n: number) => Math.max(0, Math.floor(n));
    if (state.phase !== 'running' || !state.startedAtUnixMs) return clamp(state.remainingSec ?? state.durationSec ?? 0);
    const elapsed = (Date.now() - state.startedAtUnixMs) / 1000;
    const rem = (state.durationSec ?? 0) - elapsed;
    return clamp(rem);
  }

  /* ===== Periodo (REST de cuartos) ===== */
  cuartosIniciar(partidoId: number): Observable<PeriodState> {
    return this.http.post<PeriodState>(`${this.api}/api/partidos/${partidoId}/cuartos/iniciar`, {})
      .pipe(tap(next => this.period$.next(next)));
  }
  cuartosFinalizar(partidoId: number): Observable<PeriodState> {
    return this.http.post<PeriodState>(`${this.api}/api/partidos/${partidoId}/cuartos/finalizar`, {})
      .pipe(tap(p => this.period$.next(p)));
  }
  cuartosProrroga(partidoId: number): Observable<PeriodState> {
    return this.http.post<PeriodState>(`${this.api}/api/partidos/${partidoId}/cuartos/prorroga`, {})
      .pipe(tap(p => this.period$.next(p)));
  }

  private async broadcastPeriod(p: PeriodState) {
    this.period$.next(p);
    try { await this.hub?.invoke('PeriodControl', p); } catch {}
  }

  async setQuarter(n: number) {
    const cur = this.period$.value;
    const num = Math.max(1, Math.min(cur.total, n));
    const next: PeriodState = { numero: num, total: cur.total, esProrroga: false, rotulo: null };
    await this.broadcastPeriod(next);
    await this.timerReset(600, false);
  }
  async nextQuarter() { await this.setQuarter(this.period$.value.numero + 1); }

  // 🚫 Bloqueado
  async prevQuarter() {
    this.msg$.next('No se puede volver al cuarto anterior.');
    try { await this.playEnd(true); } catch {}
  }

  // === Prórroga: abrir en BD, dejar reloj listo (detenido) ===
  async startOvertime() {
    const pid = this.hasPartido(); if (!pid) return;
    try {
      const dto = await firstValueFrom(this.cuartosProrroga(pid));
      await this.timerReset(this.quarterDurationSec(dto), false); // silencioso
      // NO iniciar. Tú luego pulsas ▶ Iniciar.
    } catch {
      // fallback local si algo falla
      const cur = this.period$.value;
      const next: PeriodState = { ...cur, esProrroga: true, rotulo: null };
      await this.broadcastPeriod(next);
      await this.timerReset(300, false);
    }
  }

  // ===== Marcadores manuales de descanso (no inician reloj) =====
  private async setBreak(seconds: number, rotulo: 'Descanso' | 'Medio tiempo') {
    const cur = this.period$.value;
    const next: PeriodState = { ...cur, esProrroga: false, rotulo };
    await this.broadcastPeriod(next);
    await this.timerReset(seconds, false);
  }
  async markDescanso()  { await this.setBreak(120, 'Descanso'); }
  async markMedio()     { await this.setBreak(900, 'Medio tiempo'); }

  /* ===== Equipos ===== */
  async setTeam(side: 'local' | 'visitante', equipo: EquipoMini | null) {
    const cur = this.teams$.value;
    const next: TeamsState = side === 'local' ? { ...cur, local: equipo } : { ...cur, visitante: equipo };
    this.teams$.next(next);
    try { await this.hub?.invoke('TeamsControl', next as any); } catch {}
  }

  /* ===== REST varios ===== */
  getEquipos(): Observable<any[]> { return this.http.get<any[]>(`${this.api}/api/equipos`); }
  getJugadores(equipoId: number): Observable<any[]> { return this.http.get<any[]>(`${this.api}/api/jugadores/por-equipo/${equipoId}`); }

  /* FALTAS */
  getFoulsResumen(partidoId: number): Observable<FoulsState> {
    return this.http.get<FoulsState>(`${this.api}/api/partidos/${partidoId}/faltas/resumen`);
  }
  ajustarFalta(
    partidoId: number,
    body: { equipoId: number; jugadorId: number; delta: 1 | -1; }
  ): Observable<FoulsState> {
    return this.http
      .post<FoulsState>(`${this.api}/api/partidos/${partidoId}/faltas/ajustar`, body)
      .pipe(tap(resumen => this.fouls$.next(resumen)));
  }
  resetFaltas(partidoId: number): Observable<any> {
    return this.http.delete(`${this.api}/api/partidos/${partidoId}/faltas/reset`);
  }

  /* TIEMPOS MUERTOS */
  getTimeoutsResumen(partidoId: number): Observable<TimeoutsState> {
    return this.http.get<TimeoutsState>(`${this.api}/api/partidos/${partidoId}/tiempos-muertos/resumen`);
  }
  ajustarTimeout(
    partidoId: number,
    body: { equipoId: number; tipo: 'corto' | 'largo'; delta: 1 | -1; }
  ): Observable<TimeoutsState> {
    const p = this.period$.value;
    const payload: any = {
      ...body,
      numeroCuarto: p.numero,
      esProrroga: !!p.esProrroga
    };
    return this.http
      .post<TimeoutsState>(`${this.api}/api/partidos/${partidoId}/tiempos-muertos/ajustar`, payload)
      .pipe(tap(state => this.timeouts$.next(state)));
  }
  resetTimeouts(partidoId: number): Observable<any> {
    return this.http.delete(`${this.api}/api/partidos/${partidoId}/tiempos-muertos/reset`);
  }

  /* ======= RESET TOTAL DEL PARTIDO (BORRA) ======= */
  private deletePartido(partidoId: number): Observable<any> {
    return this.http.delete(`${this.api}/api/partidos/${partidoId}`);
  }
  async resetMatch(partidoId: number | null) {
    if (partidoId && partidoId > 0) {
      try { await firstValueFrom(this.deletePartido(partidoId)); } catch {}
    }
    this.clearPartidoLocalState();
    try { await this.hub?.invoke('PeriodControl', this.period$.value); } catch {}
    try { await this.hub?.invoke('TimerControl',  this.timer$.value);  } catch {}
  }

  /* ======= GUARDAR (FINALIZAR SIN BORRAR) ======= */
  async saveMatch(partidoId: number | null) {
    if (!partidoId || partidoId <= 0) return;

    try {
      await firstValueFrom(this.http.post(`${this.api}/api/partidos/${partidoId}/finalizar`, {}));
    } catch {
      // si falla el POST igual limpiamos local para no trabar la UI
    }

    // Limpiar solo el estado local y devolver reloj/periodo base
    this.clearPartidoLocalState();

    // Notificar a visor/panel (esta pestaña) el "estado base" por el Hub
    try { await this.hub?.invoke('PeriodControl', this.period$.value); } catch {}
    try { await this.hub?.invoke('TimerControl',  this.timer$.value);  } catch {}
  }
}
