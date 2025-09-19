import { Component, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-visor',
  standalone: true,
  template: `
<main class="app app-visor">

  <!-- IZQ: faltas local -->
  <aside class="card side left">
    <div class="header">
      <h3>Faltas — Local</h3>
      <span class="badge">—</span>
    </div>
    <div class="roster"><!-- se rellena dinámicamente --></div>
  </aside>

  <!-- CENTRO: marcador -->
  <section class="card center-card">
    <div class="header">
      <h3 class="ttl">Marcador — Partido —</h3>
      <span class="badge">FIBA: cuarto 10:00 • prórroga 5:00</span>
    </div>

    <div class="scoreboard">
      <div class="team local">
        <div class="name"><span class="dot"></span><span>Local • Local</span></div>
        <div class="score" style="color:var(--teamA)">0</div>
        <div class="substats"><span>Faltas: <b>0</b></span><span>Tiempos muertos: <b>0</b></span></div>
      </div>

      <div class="team visitante">
        <div class="name"><span class="dot"></span><span>Visitante • Visitante</span></div>
        <div class="score" style="color:var(--teamB)">0</div>
        <div class="substats"><span>Faltas: <b>0</b></span><span>Tiempos muertos: <b>0</b></span></div>
      </div>

      <div class="center">
        <div class="timer">
          <span class="pill">Cuarto 0/4</span>
          <div class="time">00:00</div>
          <span class="pill">10:00</span>
        </div>
        <div class="progress"><i></i></div>
      </div>
    </div>
  </section>

  <!-- DER: faltas visitante -->
  <aside class="card side right">
    <div class="header">
      <h3>Faltas — Visitante</h3>
      <span class="badge">—</span>
    </div>
    <div class="roster"><!-- se rellena dinámicamente --></div>
  </aside>
</main>
  `
})
export class VisorComponent implements AfterViewInit, OnDestroy {
  private subs: Subscription[] = [];
  private tick?: any;

  constructor(private api: ApiService, private el: ElementRef<HTMLElement>) {
    this.api.connectHub();
  }

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;

    const titleEl  = host.querySelector('.center-card .header .ttl') as HTMLElement | null;

    const timeEl   = host.querySelector('.time') as HTMLElement | null;
    const barEl    = host.querySelector('.progress i') as HTMLElement | null;
    const leftPill = host.querySelectorAll('.timer .pill')[0] as HTMLElement | null;
    const rightPill= host.querySelectorAll('.timer .pill')[1] as HTMLElement | null;
    const scoreLocalEl = host.querySelector('.team.local .score') as HTMLElement | null;
    const scoreVisitEl = host.querySelector('.team.visitante .score') as HTMLElement | null;

    const badgeLeft    = host.querySelector('.side.left .badge') as HTMLElement | null;
    const badgeRight   = host.querySelector('.side.right .badge') as HTMLElement | null;
    const nameLocalTxt = host.querySelector('.team.local .name span:nth-child(2)') as HTMLElement | null;
    const nameVisitTxt = host.querySelector('.team.visitante .name span:nth-child(2)') as HTMLElement | null;

    const rosterLeft   = host.querySelector('.side.left .roster') as HTMLElement | null;
    const rosterRight  = host.querySelector('.side.right .roster') as HTMLElement | null;

    const foulsLocalB  = host.querySelector('.team.local .substats span:first-child b') as HTMLElement | null;
    const foulsVisitB  = host.querySelector('.team.visitante .substats span:first-child b') as HTMLElement | null;

    // TM labels
    const tmLocalB  = host.querySelector('.team.local .substats span:last-child b') as HTMLElement | null;
    const tmVisitB  = host.querySelector('.team.visitante .substats span:last-child b') as HTMLElement | null;

    // Título con partidoId
    const renderTitle = () => {
      const pid = this.api.partidoId$.value;
      if (titleEl) titleEl.textContent = pid ? `Marcador — Partido #${String(pid).padStart(3,'0')}` : 'Marcador — Partido —';
    };
    renderTitle();
    this.subs.push(this.api.partidoId$.subscribe(renderTitle));

    // Equipos
    const renderTeams = () => {
      const t = this.api.teams$.value;
      if (badgeLeft)    badgeLeft.textContent = t.local?.nombre ?? '—';
      if (badgeRight)   badgeRight.textContent = t.visitante?.nombre ?? '—';
      if (nameLocalTxt) nameLocalTxt.textContent = `${t.local?.nombre ?? 'Local'} • Local`;
      if (nameVisitTxt) nameVisitTxt.textContent = `${t.visitante?.nombre ?? 'Visitante'} • Visitante`;
    };
    renderTeams();
    this.subs.push(this.api.teams$.subscribe(renderTeams));

    // Reloj
    const renderClock = () => {
      const st = this.api.timer$.value;
      const rem = this.api.computeRemainingNow(st);
      if (timeEl)    timeEl.textContent    = this.mmss(rem);
      if (rightPill) rightPill.textContent = this.mmss(st.durationSec || 0);
      if (barEl) {
        const spent = (st.durationSec || 0) - rem;
        const total = st.durationSec || 1;
        const pct = Math.max(0, Math.min(100, (spent / total) * 100));
        barEl.style.width = `${pct}%`;
      }
    };
    renderClock();
    this.tick = setInterval(renderClock, 200);

    // Marcador (reacciona a SignalR / API)
    const sSub = this.api.score$.subscribe(s => {
      if (scoreLocalEl) scoreLocalEl.textContent  = String(s.local);
      if (scoreVisitEl) scoreVisitEl.textContent  = String(s.visitante);
    });
    this.subs.push(sSub);

    // Cuarto / Rótulo
    const renderPeriod = () => {
      const p = this.api.period$.value;
      if (!leftPill) return;
      if (p.rotulo) leftPill.textContent = p.rotulo;
      else if (p.esProrroga) leftPill.textContent = 'Prórroga';
      else leftPill.textContent = `Cuarto ${p.numero}/${p.total}`;
    };
    renderPeriod();
    const pSub = this.api.period$.subscribe(() => renderPeriod());
    this.subs.push(pSub);

    // Sonido
    let lastPhase = this.api.timer$.value.phase;
    const tSub = this.api.timer$.subscribe(st => {
      if (st.phase !== lastPhase) {
        if (st.phase === 'running')  this.api.playStart();
        if (st.phase === 'finished') this.api.playEnd();
        lastPhase = st.phase;
      }
    });
    this.subs.push(tSub);

    // FALTAS (render dinámico)
    const renderFoulRoster = (el: HTMLElement | null, items: { jugadorId: number; dorsal?: number; nombre: string; faltas: number }[]) => {
      if (!el) return;
      if (!items || items.length === 0) {
        el.innerHTML = '';
        return;
      }
      el.innerHTML = items
        .sort((a,b) => (a.dorsal ?? 999) - (b.dorsal ?? 999))
        .map(j => {
          const cls = j.faltas >= 5 ? 'danger' : (j.faltas === 4 ? 'warn' : '');
          const tag = j.dorsal != null ? String(j.dorsal) : '—';
          return `
            <div class="foul-item">
              <div class="who"><span class="avatar ${el === rosterLeft ? 'home' : 'away'}">${tag}</span><span class="name">${j.nombre}</span></div>
              <span class="count ${cls}">${j.faltas}</span>
            </div>`;
        }).join('');
    };

    const fSub = this.api.fouls$.subscribe(f => {
      renderFoulRoster(rosterLeft,  f.local.jugadores);
      renderFoulRoster(rosterRight, f.visitante.jugadores);
      if (foulsLocalB) foulsLocalB.textContent  = String(f.local.totalEquipo);
      if (foulsVisitB) foulsVisitB.textContent  = String(f.visitante.totalEquipo);
    });
    this.subs.push(fSub);

    // TM (render dinámico)
    const tmSub = this.api.timeouts$.subscribe(t => {
      if (tmLocalB) tmLocalB.textContent = String(t.local.total);
      if (tmVisitB) tmVisitB.textContent = String(t.visitante.total);
    });
    this.subs.push(tmSub);
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
