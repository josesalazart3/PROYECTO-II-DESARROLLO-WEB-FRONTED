// src/app/pages/control/control.component.ts
import { Component, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { ApiService, EquipoMini } from '../../core/api.service';
import { Subscription, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-control',
  standalone: true,
  template: `
<!-- ===================== LATERALES ===================== -->
<aside class="sidecard sidecard-left" aria-label="Equipo Local" data-side="local">
  <div class="sidecard-head">
    <h3>Equipo — Local</h3>
    <span class="pill-mini teamA" id="badgeLocal">—</span>
  </div>

  <div class="sidecard-body">
    <label class="field">
      <span>EQUIPO</span>
      <div class="select" style="width:100%">
        <select class="sel" id="selectLocal" aria-label="Seleccionar equipo local">
          <option value="" disabled selected>— Selecciona equipo —</option>
        </select>
      </div>
    </label>

    <div class="field">
      <span>JUGADORES</span>
      <div class="roster" id="rosterLocal"></div>
    </div>

    <div class="row">
      <button class="btn primary">Aplicar</button>
      <button class="btn subtle">Reiniciar</button>
    </div>
  </div>

  <span class="shelf"></span>
</aside>

<aside class="sidecard sidecard-right" aria-label="Equipo Visitante" data-side="visitante">
  <div class="sidecard-head">
    <h3>Equipo — Visitante</h3>
    <span class="pill-mini teamB" id="badgeVisitante">—</span>
  </div>

  <div class="sidecard-body">
    <label class="field">
      <span>EQUIPO</span>
      <div class="select" style="width:100%">
        <select class="sel" id="selectVisitante" aria-label="Seleccionar equipo visitante">
          <option value="" disabled selected>— Selecciona equipo —</option>
        </select>
      </div>
    </label>

    <div class="field">
      <span>JUGADORES</span>
      <div class="roster" id="rosterVisitante"></div>
    </div>

    <div class="row">
      <button class="btn primary">Aplicar</button>
      <button class="btn subtle">Reiniciar</button>
    </div>
  </div>

  <span class="shelf"></span>
</aside>
<!-- ===================================================== -->

<main class="app">
  <aside class="card" style="position:relative;">
    <div class="header">
      <h3>Panel de Control</h3>
      <span class="badge">UI Estática</span>
    </div>

    <div class="panel">

      <!-- PUNTOS -->
      <div class="section">
        <h4>Puntos</h4>
        <div class="row">
          <span class="pill-mini">Local</span>
          <button class="btn">+1</button><button class="btn">+2</button><button class="btn">+3</button>
          <button class="btn subtle">−1</button><button class="btn subtle">−2</button><button class="btn subtle">−3</button>
        </div>
        <div class="row" style="margin-top:10px">
          <span class="pill-mini">Visitante</span>
          <button class="btn">+1</button><button class="btn">+2</button><button class="btn">+3</button>
          <button class="btn subtle">−1</button><button class="btn subtle">−2</button><button class="btn subtle">−3</button>
        </div>
      </div>

      <!-- TIEMPO -->
      <div class="section">
        <h4>Tiempo</h4>
        <div class="row">
          <span class="pill-mini">Modo: <b>Juego</b></span>
          <label class="toggle" title="Activar sonido al iniciar/finalizar">
            <input id="enableSound" type="checkbox" checked>
            <span class="ui"></span>
          </label>
          <span class="pill-mini">🔔 Sonido inicio/fin</span>
        </div>
        <div class="row" style="margin-top:10px">
          <button class="btn success" data-action="start">▶ Iniciar</button>
          <button class="btn subtle" data-action="pause">⏸ Pausa</button>
          <button class="btn subtle" data-action="reset">⟲ Reiniciar</button>
          <button class="btn subtle" data-action="finish">⏹ Finalizar</button>
          <button class="btn subtle" data-action="test">🔔 Probar sonido</button>
        </div>
        <div class="row" style="margin-top:10px">
          <span class="pill-mini">FIBA: Cuarto 10:00 • Prórroga 5:00</span>
          <button class="btn" data-action="rest-2">☕ Descanso 2:00</button>
          <button class="btn" data-action="halftime-15">⏳ Medio tiempo 15:00</button>
        </div>
        <div class="row" style="margin-top:10px">
          <span class="pill-mini">Restante: 03:42</span>
        </div>

        <!-- ====== TIEMPOS MUERTOS ====== -->
        <div class="row" style="margin-top:16px">
          <h5 style="margin:0">Tiempos muertos</h5>
        </div>

        <div class="row" style="align-items:center;gap:10px;margin-top:6px">
          <span class="pill-mini">Local</span>
          <div class="select">
            <select class="sel sel-tm" id="tmTipoLocal" aria-label="Tipo TM local">
              <option value="corto" selected>Corto</option>
              <option value="largo">Largo</option>
            </select>
          </div>
          <button class="btn" id="btnTmLocalPlus">+ TM</button>
          <button class="btn subtle" id="btnTmLocalMinus">− TM</button>
          <span class="pill-mini">Total: <b id="tmLocalTotal">0</b></span>
          <span class="pill-mini">Cortos: <b id="tmLocalCortos">0</b></span>
          <span class="pill-mini">Largos: <b id="tmLocalLargos">0</b></span>
        </div>

        <div class="row" style="align-items:center;gap:10px;margin-top:10px">
          <span class="pill-mini">Visitante</span>
          <div class="select">
            <select class="sel sel-tm" id="tmTipoVisit" aria-label="Tipo TM visitante">
              <option value="corto" selected>Corto</option>
              <option value="largo">Largo</option>
            </select>
          </div>
          <button class="btn" id="btnTmVisitPlus">+ TM</button>
          <button class="btn subtle" id="btnTmVisitMinus">− TM</button>
          <span class="pill-mini">Total: <b id="tmVisitTotal">0</b></span>
          <span class="pill-mini">Cortos: <b id="tmVisitCortos">0</b></span>
          <span class="pill-mini">Largos: <b id="tmVisitLargos">0</b></span>
        </div>
        <!-- ===================================== -->
      </div>

      <!-- CUARTOS -->
      <div class="section">
        <h4>Cuartos</h4>
        <div class="row">
          <span class="pill-mini">Cuarto actual: <b>3/4</b></span>
          <button class="btn subtle" data-action="prev-period">⟵ Anterior</button>
          <button class="btn" data-action="next-period">⟶ Siguiente</button>
          <button class="btn subtle" data-action="overtime">Prórroga</button>
        </div>
      </div>

      <!-- FALTAS -->
      <div class="section">
        <h4>Faltas</h4>
        <div class="row">
          <span class="pill-mini">Local</span>
          <div class="select">
            <select class="sel" aria-label="Jugador local">
              <option selected>Jugador (dorsal)…</option>
            </select>
          </div>
          <button class="btn">+ Falta</button>
          <button class="btn subtle">− Falta</button>
        </div>

        <div class="row" style="margin-top:10px">
          <span class="pill-mini">Visitante</span>
          <div class="select">
            <select class="sel" aria-label="Jugador visitante">
              <option selected>Jugador (dorsal)…</option>
            </select>
          </div>
          <button class="btn">+ Falta</button>
          <button class="btn subtle">− Falta</button>
        </div>

        <div class="row foul-outs">
          <details class="collapse outbox">
            <summary>🟥 Fuera por 5 — Local <i class="caret">▾</i></summary>
            <ul class="out-list" id="outLocal">
              <li class="out-item muted">— Ninguno —</li>
            </ul>
          </details>

        <details class="collapse outbox">
            <summary>🟦 Fuera por 5 — Visitante <i class="caret">▾</i></summary>
            <ul class="out-list" id="outVisit">
              <li class="out-item muted">— Ninguno —</li>
            </ul>
          </details>
        </div>

        <div class="row" style="margin-top:10px">
          <span class="note">ⓘ Cada jugador queda fuera al llegar a <b>5 faltas personales</b>.</span>
        </div>
      </div>

      <!-- GENERAL -->
      <div class="section">
        <h4>Control General</h4>
        <div class="row">
          <button class="btn danger" id="btnResetMatch">⟲ Reset partido</button>
          <button class="btn primary" id="btnSaveMatch">💾 Guardar</button>
        </div>
      </div>
    </div>

    <!-- Toast/Mensaje temporal -->
    <div id="toastMsg" role="status" aria-live="polite"
         style="position:absolute;right:16px;bottom:16px;display:none;padding:10px 14px;border-radius:10px;background:var(--bgElevated,#111);color:var(--fg,#fff);box-shadow:0 6px 20px rgba(0,0,0,.25);">
      <!-- contenido dinámico -->
    </div>

    <!-- Confirmación Guardar -->
    <div id="confirmSave" style="position:fixed;inset:0;display:none;background:rgba(0,0,0,.35);backdrop-filter:saturate(120%) blur(2px);align-items:center;justify-content:center;z-index:9999;">
      <div style="background:var(--bgElevated,#111);color:var(--fg,#fff);padding:18px 20px;border-radius:16px;min-width:280px;max-width:90%;box-shadow:0 10px 30px rgba(0,0,0,.35);">
        <h4 style="margin:0 0 8px 0">¿Guardar partido?</h4>
        <p style="margin:0 0 14px 0;">Se conservarán los datos en la BD y se limpiará el visor para iniciar el siguiente partido.</p>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn subtle" id="btnNoSave">No</button>
          <button class="btn primary" id="btnYesSave">Sí, guardar</button>
        </div>
      </div>
    </div>

    <span class="glow g1"></span>
    <span class="glow g2"></span>
  </aside>
</main>
  `
})
export class ControlComponent implements AfterViewInit, OnDestroy {
  private tick?: any;
  private subs: Subscription[] = [];

  private equipos: any[] = [];
  private rosterCache: { local: any[]; visitante: any[] } = { local: [], visitante: [] };

  constructor(private api: ApiService, private el: ElementRef<HTMLElement>) {
    this.api.connectHub();
  }

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;

    /* LATERALES */
    const left  = host.querySelector('.sidecard-left')  as HTMLElement | null;
    const right = host.querySelector('.sidecard-right') as HTMLElement | null;

    const selLocal  = left ?.querySelector('#selectLocal')      as HTMLSelectElement | null;
    const selVisit  = right?.querySelector('#selectVisitante')  as HTMLSelectElement | null;
    const badLocal  = left ?.querySelector('#badgeLocal')       as HTMLElement | null;
    const badVisit  = right?.querySelector('#badgeVisitante')   as HTMLElement | null;
    const rostLocal = left ?.querySelector('#rosterLocal')      as HTMLElement | null;
    const rostVisit = right?.querySelector('#rosterVisitante')  as HTMLElement | null;

    /* FALTAS section */
    const secFaltas = Array.from(host.querySelectorAll('.section'))
      .find(s => s.querySelector('h4')?.textContent?.trim().toLowerCase() === 'faltas') as HTMLElement | undefined;
    const rowFLocal = secFaltas?.querySelectorAll('.row')[0] as HTMLElement | undefined;
   const rowFVisit = secFaltas?.querySelectorAll('.row')[1] as HTMLElement | undefined;

    const selFaltaLocal = rowFLocal?.querySelector('select[aria-label="Jugador local"]') as HTMLSelectElement | null;
    const selFaltaVisit = rowFVisit?.querySelector('select[aria-label="Jugador visitante"]') as HTMLSelectElement | null;
    const btnLocalPlus  = rowFLocal?.querySelectorAll('button')[0] as HTMLButtonElement | null;
    const btnLocalMinus = rowFLocal?.querySelectorAll('button')[1] as HTMLButtonElement | null;
    const btnVisitPlus  = rowFVisit?.querySelectorAll('button')[0] as HTMLButtonElement | null;
    const btnVisitMinus = rowFVisit?.querySelectorAll('button')[1] as HTMLButtonElement | null;

    const outLocalUl = secFaltas?.querySelector('#outLocal') as HTMLElement | null;
    const outVisitUl = secFaltas?.querySelector('#outVisit') as HTMLElement | null;

    /* ====== TIEMPOS MUERTOS (UI refs) ====== */
    const tmTipoLocalSel = host.querySelector('#tmTipoLocal') as HTMLSelectElement | null;
    const tmTipoVisitSel = host.querySelector('#tmTipoVisit') as HTMLSelectElement | null;
    const btnTmLocalPlus  = host.querySelector('#btnTmLocalPlus')  as HTMLButtonElement | null;
    const btnTmLocalMinus = host.querySelector('#btnTmLocalMinus') as HTMLButtonElement | null;
    const btnTmVisitPlus  = host.querySelector('#btnTmVisitPlus')  as HTMLButtonElement | null;
    const btnTmVisitMinus = host.querySelector('#btnTmVisitMinus') as HTMLButtonElement | null;

    const tmLocalTotal  = host.querySelector('#tmLocalTotal')  as HTMLElement | null;
    const tmLocalCortos = host.querySelector('#tmLocalCortos') as HTMLElement | null;
    const tmLocalLargos = host.querySelector('#tmLocalLargos') as HTMLElement | null;

    const tmVisitTotal  = host.querySelector('#tmVisitTotal')  as HTMLElement | null;
    const tmVisitCortos = host.querySelector('#tmVisitCortos') as HTMLElement | null;
    const tmVisitLargos = host.querySelector('#tmVisitLargos') as HTMLElement | null;

    const blankBadge = '—';
    const getId = (e: any) => e?.id ?? e?.equipo_id ?? e?.equipoId;
    const getName = (e: any) => e?.nombre ?? e?.name ?? '';

    /* UI helpers */
    const clearAndFillTeams = (sel: HTMLSelectElement | null, items: any[]) => {
      if (!sel) return;
      while (sel.options.length > 1) sel.remove(1);
      items.forEach(e => {
        const opt = document.createElement('option');
        opt.value = String(getId(e));
        opt.textContent = getName(e);
        sel.appendChild(opt);
      });
    };

    const renderRoster = (el: HTMLElement | null, jugadores: any[]) => {
      if (!el) return;
      if (!jugadores || jugadores.length === 0) { el.innerHTML = ''; return; }
      el.innerHTML = jugadores.map(j => {
        const dorsal = (j.dorsal ?? j.numero ?? j.num ?? null);
        const pos = j.posicion ?? j.pos ?? null;
        const nombre = [j.nombres, j.apellidos].filter(Boolean).join(' ');
        return `
          <div class="roster-item" style="display:flex;align-items:center;gap:8px;margin:4px 0;">
            <span class="tag" style="display:inline-block;min-width:32px;text-align:center;border:1px solid var(--border);border-radius:6px;padding:2px 6px;">
              ${dorsal ?? '—'}
            </span>
            <span class="name">${nombre}${pos ? ` <small>(${pos})</small>` : ''}</span>
          </div>
        `;
      }).join('');
    };

    const fillFoulSelect = (target: HTMLSelectElement | null, jugadores: any[]) => {
      if (!target) return;
      const first = target.querySelector('option');
      target.innerHTML = first ? first.outerHTML : `<option selected>Jugador (dorsal)…</option>`;
      jugadores.forEach(j => {
        const opt = document.createElement('option');
        opt.value = String(j.jugador_id ?? j.id ?? j.jugadorId);
        const dorsal = j.dorsal ?? '—';
        const nombre = [j.nombres, j.apellidos].filter(Boolean).join(' ') || j.nombre || '';
        opt.textContent = `#${dorsal} ${nombre}`;
        target.appendChild(opt);
      });
    };

    /* Buscar un equipo por id */
    const findEquipoMini = (idStr: string): EquipoMini | null => {
      if (!idStr) return null;
      const idNum = Number(idStr);
      const raw = this.equipos.find(e => Number(getId(e)) === idNum);
      return raw ? {
        id: Number(getId(raw)),
        nombre: getName(raw),
        abreviatura: raw.abreviatura ?? raw.abrev,
        color: raw.color ?? raw.color_primario ?? undefined
      } : null;
    };

    /* Cargar roster/selecciones de faltas para un side */
    const loadSideRoster = (side: 'local'|'visitante', equipoId: number | null) => {
      const rosterEl = (side === 'local') ? rostLocal : rostVisit;
      const targetSel = (side === 'local') ? selFaltaLocal : selFaltaVisit;

      if (!equipoId || equipoId <= 0) {
        if (rosterEl) rosterEl.innerHTML = '';
        fillFoulSelect(targetSel, []);
        if (side === 'local') this.rosterCache.local = [];
        else this.rosterCache.visitante = [];
        return;
      }

      this.api.getJugadores(equipoId).subscribe({
        next: (rows) => {
          const jugadores = Array.isArray(rows) ? rows : [];
          renderRoster(rosterEl, jugadores);
          fillFoulSelect(targetSel, jugadores);
          if (side === 'local') this.rosterCache.local = jugadores;
          else this.rosterCache.visitante = jugadores;
        },
        error: () => {
          renderRoster(rosterEl, []);
          fillFoulSelect(targetSel, []);
          if (side === 'local') this.rosterCache.local = [];
          else this.rosterCache.visitante = [];
        }
      });
    };

    /* Aplicar selección manual */
    const applySide = (side: 'local'|'visitante', team: EquipoMini | null, badge: HTMLElement | null) => {
      if (badge) badge.textContent = team ? team.nombre : blankBadge;
      this.api.setTeam(side, team);
      const equipoId = team?.id ?? null;
      loadSideRoster(side, equipoId);
    };

    /* Wire botones laterales */
    const wireApplyReset = (
      sideCard: HTMLElement | null,
      side: 'local'|'visitante',
      selTeam: HTMLSelectElement | null,
      badge: HTMLElement | null
    ) => {
      if (!sideCard) return;
      const btns = sideCard.querySelectorAll('.row button');
      const btnApply = btns[0] as HTMLButtonElement | undefined;
      const btnReset = btns[1] as HTMLButtonElement | undefined;

      btnApply?.addEventListener('click', () => {
        const team = selTeam?.value ? findEquipoMini(selTeam.value) : null;
        applySide(side, team, badge);
      });

      btnReset?.addEventListener('click', async () => {
        if (selTeam) selTeam.selectedIndex = 0;
        if (badge) badge.textContent = blankBadge;
        await this.api.setTeam(side, null);
        loadSideRoster(side, null);
      });
    };

    wireApplyReset(left,  'local',     selLocal, badLocal);
    wireApplyReset(right, 'visitante', selVisit, badVisit);

    /* ====== HIDRATAR UI DESDE ESTADO PERSISTENTE ====== */
    const setSelectValueIfExists = (sel: HTMLSelectElement | null, value: string | null) => {
      if (!sel) return;
      if (!value) { sel.selectedIndex = 0; return; }
      const opt = Array.from(sel.options).find(o => o.value === value);
      sel.selectedIndex = opt ? opt.index : 0;
    };

    const syncUIFromState = () => {
      const t = this.api.teams$.value;

      // badges
      if (badLocal) badLocal.textContent = t.local ? t.local.nombre : blankBadge;
      if (badVisit) badVisit.textContent = t.visitante ? t.visitante.nombre : blankBadge;

      // selects (solo si ya tenemos lista de equipos)
      if (this.equipos.length > 0) {
        setSelectValueIfExists(selLocal,  t.local     ? String(t.local.id)     : null);
        setSelectValueIfExists(selVisit,  t.visitante ? String(t.visitante.id) : null);
      }

      // rosters + selects de faltas
      loadSideRoster('local',     t.local?.id     ?? null);
      loadSideRoster('visitante', t.visitante?.id ?? null);
    };

    // 1) Cargar equipos; luego hidratar UI
    this.api.getEquipos().subscribe({
      next: (rows) => {
        this.equipos = Array.isArray(rows) ? rows : [];
        clearAndFillTeams(selLocal, this.equipos);
        clearAndFillTeams(selVisit, this.equipos);
        syncUIFromState();
      },
      error: () => { syncUIFromState(); }
    });

    // 2) Resincronizar si cambia teams$
    const teamsSub = this.api.teams$.subscribe(() => { syncUIFromState(); });
    this.subs.push(teamsSub);

    /* PUNTOS -> via API */
    const secPuntos = Array.from(host.querySelectorAll('.section'))
      .find(s => s.querySelector('h4')?.textContent?.trim().toLowerCase() === 'puntos') as HTMLElement | undefined;

    const ensurePid = (): number | null => {
      const pid = this.api.partidoId$.value;
      if (!pid) { alert('Primero inicia el partido (elige Local y Visitante y pulsa ▶ Iniciar).'); return null; }
      return pid;
    };
    const teamFor = (side: 'local'|'visitante') => (side === 'local' ? this.api.teams$.value.local : this.api.teams$.value.visitante);

    if (secPuntos) {
      const rows = secPuntos.querySelectorAll('.row');
      const bindRow = (row: Element, side: 'local' | 'visitante') => {
        const btns = Array.from(row.querySelectorAll('button'));
        const apply = async (delta: -3|-2|-1|1|2|3) => {
          const pid = ensurePid(); if (!pid) return;
          const team = teamFor(side);
          if (!team) { alert(`Selecciona equipo ${side}.`); return; }
          this.api.ajustarPuntos(pid, { equipoId: team.id, puntos: delta }).subscribe();
        };
        btns.forEach(btn => {
          const txt = btn.textContent?.trim();
          if (!txt) return;
          if (txt === '+1') btn.addEventListener('click', () => apply(+1));
          if (txt === '+2') btn.addEventListener('click', () => apply(+2));
          if (txt === '+3') btn.addEventListener('click', () => apply(+3));
          if (txt === '−1') btn.addEventListener('click', () => apply(-1));
          if (txt === '−2') btn.addEventListener('click', () => apply(-2));
          if (txt === '−3') btn.addEventListener('click', () => apply(-3));
        });
      };
      if (rows[0]) bindRow(rows[0], 'local');
      if (rows[1]) bindRow(rows[1], 'visitante');
    }

    /* TIEMPO */
    const secTiempo = Array.from(host.querySelectorAll('.section'))
      .find(s => s.querySelector('h4')?.textContent?.trim().toLowerCase() === 'tiempo') as HTMLElement | undefined;

    const soundChk = secTiempo?.querySelector('#enableSound') as HTMLInputElement | null;
    if (soundChk) {
      soundChk.checked = this.api.soundEnabled$.value;
      soundChk.addEventListener('change', () => this.api.setSoundEnabled(!!soundChk.checked));
      const sSub = this.api.soundEnabled$.subscribe(on => { if (soundChk.checked !== on) soundChk.checked = on; });
      this.subs.push(sSub);
    }

    // Helper para asegurar que existe el partido (y crearlo si no)
    const ensurePartido = async (): Promise<number | null> => {
      const t = this.api.teams$.value;
      const localId = t.local?.id ?? 0;
      const visitId = t.visitante?.id ?? 0;
      if (!localId || !visitId) { alert('Selecciona equipo Local y Visitante.'); return null; }
      if (localId === visitId)   { alert('ELIGE EQUIPOS DIFERENTES.'); return null; }
      try { return await this.api.startPartido(localId, visitId); }
      catch (e: any) { alert(e?.message ?? 'No se pudo crear el partido.'); return null; }
    };

    if (secTiempo) {
      const bind = (action: string, handler: () => void | Promise<void>) => {
        const btn = secTiempo.querySelector(`button[data-action="${action}"]`) as HTMLButtonElement | null;
        btn?.addEventListener('click', () => handler());
      };

      const startBtn  = secTiempo.querySelector('button[data-action="start"]')  as HTMLButtonElement | null;
      const pauseBtn  = secTiempo.querySelector('button[data-action="pause"]')  as HTMLButtonElement | null;
      const finishBtn = secTiempo.querySelector('button[data-action="finish"]') as HTMLButtonElement | null;

      // ▶ Iniciar: ahora se deshabilita en cuanto corre (y también si está pausado)
      bind('start', async () => {
        const phaseNow = this.api.timer$.value.phase;
        if (phaseNow === 'running' || phaseNow === 'paused') return; // seguridad

        const pid = await ensurePartido(); if (!pid) return;

        const p = this.api.period$.value;

        // Descanso / Medio tiempo
        if (p.rotulo === 'Descanso') {
          await this.api.timerReset(120, false);
          await this.api.timerStart();
          if (startBtn) { startBtn.disabled = true; startBtn.title = 'El cronómetro ya está corriendo'; }
          return;
        }
        if (p.rotulo === 'Medio tiempo') {
          await this.api.timerReset(900, false);
          await this.api.timerStart();
          if (startBtn) { startBtn.disabled = true; startBtn.title = 'El cronómetro ya está corriendo'; }
          return;
        }

        // Prórroga
        if (p.esProrroga) {
          await this.api.timerStart();
          if (startBtn) { startBtn.disabled = true; startBtn.title = 'El cronómetro ya está corriendo'; }
          return;
        }

        // Caso normal (cuarto)
        try {
          const dto = await firstValueFrom(this.api.cuartosIniciar(pid));
          const dur = this.api.quarterDurationSec(dto);
          await this.api.timerReset(dur, false);
          await this.api.timerStart();
        } catch {
          await this.api.timerReset(600, false);
          await this.api.timerStart();
        } finally {
          if (startBtn) { startBtn.disabled = true; startBtn.title = 'El cronómetro ya está corriendo'; }
        }
      });

      // ⏸ Pausa ⇄ ⏵ Reanudar
      const renderPauseBtn = () => {
        if (!pauseBtn || !startBtn) return;
        const ph = this.api.timer$.value.phase;

        // Texto/estilo del botón de pausa
        if (ph === 'paused') {
          pauseBtn.textContent = '⏵ Reanudar';
          pauseBtn.classList.remove('subtle');
          pauseBtn.classList.add('success');
          pauseBtn.title = 'Reanudar cronómetro';
        } else {
          pauseBtn.textContent = '⏸ Pausa';
          pauseBtn.classList.add('subtle');
          pauseBtn.classList.remove('success');
          pauseBtn.title = 'Pausar cronómetro';
        }

        // ▶ Iniciar: estado
        if (ph === 'running') {
          startBtn.disabled = true;
          startBtn.title = 'El cronómetro ya está corriendo';
        } else if (ph === 'paused') {
          startBtn.disabled = true;
          startBtn.title = 'Usa ⏵ Reanudar para continuar';
        } else {
          startBtn.disabled = false;
          startBtn.title = '';
        }
      };
      renderPauseBtn();
      const pauseSub = this.api.timer$.subscribe(() => renderPauseBtn());
      this.subs.push(pauseSub);

      pauseBtn?.addEventListener('click', async () => {
        const ph = this.api.timer$.value.phase;
        if (ph === 'running')      await this.api.timerPause();
        else if (ph === 'paused')  await this.api.timerStart(); // reanuda SIN resetear
      });

      // ⟲ Reiniciar (solo reloj)
      bind('reset', () => this.api.timerReset(undefined, true));

      // 🔒 Habilitación de ⏹ Finalizar
      const renderFinishBtn = () => {
        if (!finishBtn) return;
        const ph = this.api.timer$.value.phase;
        const p  = this.api.period$.value;

        const canFinish =
          p.rotulo === 'Descanso' ||
          p.rotulo === 'Medio tiempo' ||
          ph === 'running' ||
          ph === 'paused';

        finishBtn.disabled = !canFinish;
        finishBtn.title = canFinish ? '' : 'Primero pulsa ▶ Iniciar';
      };
      renderFinishBtn();
      this.subs.push(this.api.timer$.subscribe(() => renderFinishBtn()));
      this.subs.push(this.api.period$.subscribe(() => renderFinishBtn()));

      // ⏹ Finalizar
      bind('finish', async () => {
        if (finishBtn && finishBtn.disabled) return;

        const pid = this.api.partidoId$.value ?? null; if (!pid) return;

        const p = this.api.period$.value;

        // Fin de Descanso / Medio tiempo -> abrir siguiente cuarto y dejar listo (detenido)
        if (p.rotulo === 'Descanso' || p.rotulo === 'Medio tiempo') {
          try {
            const dto = await firstValueFrom(this.api.cuartosIniciar(pid));
            const dur = this.api.quarterDurationSec(dto);
            await this.api.timerReset(dur, false);
          } catch {
            await this.api.timerReset(600, false);
          }
          return;
        }

        // Fin de cuarto / prórroga
        try {
          await firstValueFrom(this.api.cuartosFinalizar(pid));
          await this.api.timerFinish();
        } catch {
          await this.api.timerFinish();
        }
      });

      // 🔔 Probar sonido
      bind('test',  () => this.api.playTest());

      // ===== Descansos manuales =====
      bind('rest-2',      () => this.api.markDescanso());
      bind('halftime-15', () => this.api.markMedio());
    }

    // ====== RESTANTE (UI) ======
    const secTiempoRef = Array.from(host.querySelectorAll('.section'))
      .find(s => s.querySelector('h4')?.textContent?.trim().toLowerCase() === 'tiempo') as HTMLElement | undefined;

    const remRow = secTiempoRef
      ? Array.from(secTiempoRef.querySelectorAll('.row')).find(r => r.textContent?.includes('Restante:'))
      : undefined;
    const remEl = remRow?.querySelector('.pill-mini') as HTMLElement | null;
    const renderRemaining = () => {
      if (!remEl) return;
      const st = this.api.timer$.value;
      const rem = this.api.computeRemainingNow(st);
      remEl.textContent = `Restante: ${this.mmss(rem)}`;
    };
    renderRemaining();
    this.tick = setInterval(renderRemaining, 200);

    // Sonidos
    let lastPhase = this.api.timer$.value.phase;
    const tSub = this.api.timer$.subscribe(st => {
      if (st.phase !== lastPhase) {
        if (st.phase === 'running')  this.api.playStart();
        if (st.phase === 'finished') this.api.playEnd();
        lastPhase = st.phase;
      }
    });
    this.subs.push(tSub);

    /* CUARTOS */
    const secCuartos = Array.from(host.querySelectorAll('.section'))
      .find(s => s.querySelector('h4')?.textContent?.trim().toLowerCase() === 'cuartos') as HTMLElement | undefined;

    if (secCuartos) {
      const labelB = secCuartos.querySelector('.row .pill-mini b') as HTMLElement | null;
      const btnPrev = secCuartos.querySelector('button[data-action="prev-period"]') as HTMLButtonElement | null;
      const btnNext = secCuartos.querySelector('button[data-action="next-period"]') as HTMLButtonElement | null;
      const btnOT   = secCuartos.querySelector('button[data-action="overtime"]')     as HTMLButtonElement | null;

      // === Controlar habilitación de PRÓRROGA ===
      const updateOvertimeButton = () => {
        const p = this.api.period$.value;
        if (btnOT) {
          if (!p.esProrroga && p.numero < p.total) {
            btnOT.disabled = true;
            btnOT.title = "Aún no se han consumido los 4 tiempos";
          } else {
            btnOT.disabled = false;
            btnOT.title = "";
          }
        }
      };
      updateOvertimeButton();
      const otSub = this.api.period$.subscribe(() => updateOvertimeButton());
      this.subs.push(otSub);

      // === Prórroga: abrir en BD solo si ya habilitado ===
      btnOT?.addEventListener('click', () => {
        if (btnOT?.disabled) {
          alert("Aún no se han consumido los 4 tiempos.");
          return;
        }
        this.api.startOvertime();
      });

      const renderCuarto = () => {
        const p = this.api.period$.value;
        if (!labelB) return;
        if (p.rotulo) labelB.textContent = p.rotulo;
        else if (p.esProrroga) labelB.textContent = 'Prórroga';
        else labelB.textContent = `${p.numero}/${p.total}`;
      };
      renderCuarto();
      const pSub = this.api.period$.subscribe(renderCuarto);
      this.subs.push(pSub);

      // 🚫 Bloquear retroceso
      btnPrev?.addEventListener('click', () => {
        alert('No se puede retroceder al cuarto anterior.');
      });

      // Siguiente: guiar al flujo correcto
      btnNext?.addEventListener('click', () => {
        alert('Usa ⏹ Finalizar para cerrar y ▶ Iniciar para continuar.');
      });
    }

    /* ==== BOTÓN RESET PARTIDO ==== */
    const btnResetMatch = host.querySelector('#btnResetMatch') as HTMLButtonElement | null;
    btnResetMatch?.addEventListener('click', async () => {
      const pid = this.api.partidoId$.value ?? null;
      await this.api.resetMatch(pid);

      // Limpiar UI local (selects y rosters de laterales / faltas)
      this.clearSideUI(host);
    });

    /* ==== BOTÓN GUARDAR (con confirmación + toast 5s) ==== */
    const btnSaveMatch = host.querySelector('#btnSaveMatch') as HTMLButtonElement | null;
    const modal = host.querySelector('#confirmSave') as HTMLElement | null;
    const btnNoSave = host.querySelector('#btnNoSave') as HTMLButtonElement | null;
    const btnYesSave = host.querySelector('#btnYesSave') as HTMLButtonElement | null;
    const toast = host.querySelector('#toastMsg') as HTMLElement | null;

    const showModal = () => { if (modal) modal.style.display = 'flex'; };
    const hideModal = () => { if (modal) modal.style.display = 'none'; };
    const showToast = (msg: string, ms = 5000) => {
      if (!toast) return;
      toast.textContent = msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, ms);
    };

    btnSaveMatch?.addEventListener('click', () => showModal());
    btnNoSave?.addEventListener('click', () => hideModal());
    modal?.addEventListener('click', (ev) => {
      if (ev.target === modal) hideModal(); // click fuera de la tarjeta
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && modal && modal.style.display !== 'none') hideModal();
    });

    btnYesSave?.addEventListener('click', async () => {
      hideModal();

      const pid = this.api.partidoId$.value ?? null;
      if (!pid) { alert('No hay partido en curso para guardar.'); return; }

      // deshabilitar botón y feedback
      const originalText = btnSaveMatch?.textContent || '';
      if (btnSaveMatch) { btnSaveMatch.disabled = true; btnSaveMatch.textContent = 'Guardando…'; }

      try {
        await this.api.saveMatch(pid);          // ⬅️ debe existir en ApiService
        await this.api.resetMatch(null);        // limpia visor/estado local SIN borrar BD
        this.clearSideUI(host);                 // por si acaso, limpiar laterales
        showToast('✅ Partido guardado. Listo para iniciar el siguiente.', 5000);
      } catch (err: any) {
        alert(err?.message ?? 'No se pudo guardar el partido.');
      } finally {
        if (btnSaveMatch) { btnSaveMatch.disabled = false; btnSaveMatch.textContent = originalText; }
      }
    });

    /* ===== FALTAS: botones (+ / −) ===== */
    const getSelectedJugador = (sel: HTMLSelectElement | null): number | null => {
      if (!sel) return null;
      const val = sel.value.trim();
      const n = Number(val);
      return Number.isFinite(n) && n > 0 ? n : null;
    };
    const teamSide = (side: 'local'|'visitante') => (side === 'local' ? this.api.teams$.value.local : this.api.teams$.value.visitante);

    btnLocalPlus ?.addEventListener('click', () => {
      const pid = ensurePid(); if (!pid) return;
      const jugadorId = getSelectedJugador(selFaltaLocal);
      const team = teamSide('local');
      if (!jugadorId || !team) return;
      this.api.ajustarFalta(pid, { equipoId: team.id, jugadorId, delta: 1 }).subscribe();
    });
    btnLocalMinus?.addEventListener('click', () => {
      const pid = ensurePid(); if (!pid) return;
      const jugadorId = getSelectedJugador(selFaltaLocal);
      const team = teamSide('local');
      if (!jugadorId || !team) return;
      this.api.ajustarFalta(pid, { equipoId: team.id, jugadorId, delta: -1 }).subscribe();
    });
    btnVisitPlus ?.addEventListener('click', () => {
      const pid = ensurePid(); if (!pid) return;
      const jugadorId = getSelectedJugador(selFaltaVisit);
      const team = teamSide('visitante');
      if (!jugadorId || !team) return;
      this.api.ajustarFalta(pid, { equipoId: team.id, jugadorId, delta: 1 }).subscribe();
    });
    btnVisitMinus?.addEventListener('click', () => {
      const pid = ensurePid(); if (!pid) return;
      const jugadorId = getSelectedJugador(selFaltaVisit);
      const team = teamSide('visitante');
      if (!jugadorId || !team) return;
      this.api.ajustarFalta(pid, { equipoId: team.id, jugadorId, delta: -1 }).subscribe();
    });

    /* Render “Fuera por 5” */
    const renderOutList = (ul: HTMLElement | null, items: { dorsal?: number; nombre: string; faltas: number }[]) => {
      if (!ul) return;
      if (!items || items.length === 0) {
        ul.innerHTML = `<li class="out-item muted">— Ninguno —</li>`;
        return;
      }
      ul.innerHTML = items.map(j => {
        const tag = j.dorsal != null ? `#${j.dorsal}` : '—';
        return `<li class="out-item"><span class="tag">${tag}</span> ${j.nombre}</li>`;
      }).join('');
    };

    const foulSub = this.api.fouls$.subscribe(f => {
      renderOutList(outLocalUl,  f.local.fuera5);
      renderOutList(outVisitUl,  f.visitante.fuera5);
    });
    this.subs.push(foulSub);

    /* ===== TIEMPOS MUERTOS ===== */
    const getTipo = (sel: HTMLSelectElement | null) => (sel?.value === 'largo' ? 'largo' : 'corto');

    const clickTm = (side:'local'|'visitante', delta: 1|-1) => {
      const pid = ensurePid(); if (!pid) return;
      const team = teamSide(side);
      if (!team) return;
      const tipo = getTipo(side === 'local' ? tmTipoLocalSel : tmTipoVisitSel) as 'corto'|'largo';
      this.api.ajustarTimeout(pid, { equipoId: team.id, tipo, delta }).subscribe();
    };

    btnTmLocalPlus ?.addEventListener('click', () => clickTm('local', +1));
    btnTmLocalMinus?.addEventListener('click', () => clickTm('local', -1));
    btnTmVisitPlus ?.addEventListener('click', () => clickTm('visitante', +1));
    btnTmVisitMinus?.addEventListener('click', () => clickTm('visitante', -1));

    const tmSub = this.api.timeouts$.subscribe(t => {
      if (tmLocalTotal)  tmLocalTotal.textContent  = String(t.local.total);
      if (tmLocalCortos) tmLocalCortos.textContent = String(t.local.cortos);
      if (tmLocalLargos) tmLocalLargos.textContent = String(t.local.largos);

      if (tmVisitTotal)  tmVisitTotal.textContent  = String(t.visitante.total);
      if (tmVisitCortos) tmVisitCortos.textContent = String(t.visitante.cortos);
      if (tmVisitLargos) tmVisitLargos.textContent = String(t.visitante.largos);
    });
    this.subs.push(tmSub);
  }

  private clearSideUI(host: HTMLElement) {
    const left  = host.querySelector('.sidecard-left')  as HTMLElement | null;
    const right = host.querySelector('.sidecard-right') as HTMLElement | null;

    const selLocal  = left ?.querySelector('#selectLocal')     as HTMLSelectElement | null;
    const selVisit  = right?.querySelector('#selectVisitante') as HTMLSelectElement | null;
    const badLocal  = left ?.querySelector('#badgeLocal')      as HTMLElement | null;
    const badVisit  = right?.querySelector('#badgeVisitante')  as HTMLElement | null;
    const rostLocal = left ?.querySelector('#rosterLocal')     as HTMLElement | null;
    const rostVisit = right?.querySelector('#rosterVisitante') as HTMLElement | null;

    const secFaltas = Array.from(host.querySelectorAll('.section'))
      .find(s => s.querySelector('h4')?.textContent?.trim().toLowerCase() === 'faltas') as HTMLElement | undefined;
    const rowFLocal = secFaltas?.querySelectorAll('.row')[0] as HTMLElement | undefined;
    const rowFVisit = secFaltas?.querySelectorAll('.row')[1] as HTMLElement | undefined;

    const selFaltaLocal = rowFLocal?.querySelector('select[aria-label="Jugador local"]') as HTMLSelectElement | null;
    const selFaltaVisit = rowFVisit?.querySelector('select[aria-label="Jugador visitante"]') as HTMLSelectElement | null;

    const outLocalUl = secFaltas?.querySelector('#outLocal') as HTMLElement | null;
    const outVisitUl = secFaltas?.querySelector('#outVisit') as HTMLElement | null;

    if (selLocal) selLocal.selectedIndex = 0;
    if (selVisit) selVisit.selectedIndex = 0;
    if (badLocal) badLocal.textContent = '—';
    if (badVisit) badVisit.textContent = '—';
    if (rostLocal) rostLocal.innerHTML = '';
    if (rostVisit) rostVisit.innerHTML = '';

    if (selFaltaLocal) selFaltaLocal.innerHTML = `<option selected>Jugador (dorsal)…</option>`;
    if (selFaltaVisit) selFaltaVisit.innerHTML = `<option selected>Jugador (dorsal)…</option>`;
    if (outLocalUl)    outLocalUl.innerHTML    = `<li class="out-item muted">— Ninguno —</li>`;
    if (outVisitUl)    outVisitUl.innerHTML    = `<li class="out-item muted">— Ninguno —</li>`;
  }

  private mmss(total: number): string {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }

  ngOnDestroy(): void {
    if (this.tick) clearInterval(this.tick);
    this.subs.forEach(s => s.unsubscribe());
  }
}
