import type { TravelPlan } from '../../types/travel'
export function AIResponse({ plan, city }: { plan: TravelPlan; city: string }) {
  return <section className="itinerary" aria-label="Roteiro gerado">
    <div className="section-heading"><div><p className="eyebrow">SUA PRÓXIMA HISTÓRIA</p><h3>Seu roteiro em {city}</h3></div>
      <button className="button secondary no-print" onClick={() => window.print()}>Imprimir / salvar PDF</button></div>
    <p>{plan.summary}</p>
    <div className="itinerary-days">{plan.days.map(day => <article className="itinerary-day" key={day.day}>
      <h4>Dia {day.day}</h4><dl>{([['Manhã', day.morning], ['Tarde', day.afternoon], ['Noite', day.evening]] as const).map(([period, description]) =>
        <div key={period}><dt>{period}</dt><dd>{description}</dd></div>)}</dl>
    </article>)}</div>
    {plan.notes.length > 0 && <ul className="plan-notes">{plan.notes.map((note, index) => <li key={index}>{note}</li>)}</ul>}
    <p className="source">Sugestões geradas por IA. Confirme preços, horários e disponibilidade antes de viajar.</p>
  </section>
}
