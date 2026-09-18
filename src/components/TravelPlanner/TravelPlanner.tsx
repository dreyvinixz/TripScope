import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Destination } from '../../types/destination'
import { interests, type TravelPlan, type TravelPreferences } from '../../types/travel'
import { buildTravelContext } from '../../services/travelContext'
import { askDestination, generatePlan } from '../../services/geminiService'
import { isValidTripDuration, parseBrl } from '../../utils/validation'
import { AIResponse } from '../AIResponse/AIResponse'
import { ErrorMessage } from '../ErrorMessage/ErrorMessage'

export function TravelPlanner({ destination }: { destination: Destination }) {
  const [days, setDays] = useState('3')
  const [budget, setBudget] = useState('3000')
  const [selected, setSelected] = useState<(typeof interests)[number][]>(['Cultura', 'Gastronomia'])
  const [plan, setPlan] = useState<TravelPlan | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [planning, setPlanning] = useState(false)
  const [asking, setAsking] = useState(false)
  const [planError, setPlanError] = useState('')
  const [questionError, setQuestionError] = useState('')
  const planController = useRef<AbortController | null>(null)
  const answerController = useRef<AbortController | null>(null)
  useEffect(() => () => { planController.current?.abort(); answerController.current?.abort() }, [])
  const amount = parseBrl(budget)
  const valid = isValidTripDuration(Number(days)) && amount !== null && amount > 0 && selected.length > 0
  const preferences: TravelPreferences = valid ? { days: Number(days), budgetBrl: amount, interests: selected } : null
  const busyData = [destination.weather, destination.country, destination.currency].some(resource => resource.status === 'loading')
  async function submitPlan(event: FormEvent) {
    event.preventDefault()
    if (!preferences) { setPlanError('Informe 1 a 14 dias, orçamento positivo até R$ 1.000.000 e ao menos um interesse.'); return }
    planController.current?.abort()
    const controller = new AbortController()
    planController.current = controller
    setPlanning(true); setPlanError(''); setPlan(null)
    try { setPlan(await generatePlan({ action: 'plan', context: buildTravelContext(destination), ...preferences }, controller.signal)) }
    catch { if (!controller.signal.aborted) setPlanError('O assistente de IA está temporariamente indisponível. Tente novamente.') }
    finally { if (!controller.signal.aborted) setPlanning(false) }
  }
  async function submitQuestion(event: FormEvent) {
    event.preventDefault()
    if (question.trim().length < 3) return
    answerController.current?.abort()
    const controller = new AbortController()
    answerController.current = controller
    setAsking(true); setQuestionError(''); setAnswer('')
    try { setAnswer((await askDestination({ action: 'question', context: buildTravelContext(destination), question: question.trim(), preferences }, controller.signal)).answer) }
    catch { if (!controller.signal.aborted) setQuestionError('O assistente de IA está temporariamente indisponível. Tente novamente.') }
    finally { if (!controller.signal.aborted) setAsking(false) }
  }
  return <section className="planner-section" aria-label="Planejamento de viagem">
    <div className="section-heading no-print"><div><p className="eyebrow">FEITO PARA O SEU JEITO DE VIAJAR</p>
      <h2>Planeje sua viagem com IA</h2></div><span className="badge">✧ Gemini</span></div>
    <div className="planner-grid no-print">
      <form className="panel" onSubmit={event => { void submitPlan(event) }} noValidate>
        <h3>Uma viagem com a sua cara</h3>
        <p className="muted">Combine seus interesses com o clima e o orçamento.</p>
        <label htmlFor="plan-destination">Destino</label><input id="plan-destination" readOnly value={destination.location.city} />
        <div className="form-row">
          <div><label htmlFor="trip-days">Quantidade de dias</label><input id="trip-days" type="number" min={1} max={14}
            value={days} onChange={event => setDays(event.target.value)} aria-describedby={planError ? 'plan-hint plan-error' : 'plan-hint'} aria-invalid={!isValidTripDuration(Number(days))} /></div>
          <div><label htmlFor="trip-budget">Orçamento total (R$)</label><input id="trip-budget" inputMode="decimal"
            value={budget} onChange={event => setBudget(event.target.value)} aria-describedby={planError ? 'plan-hint plan-error' : 'plan-hint'} aria-invalid={amount === null || amount <= 0} /></div>
        </div>
        <fieldset><legend>O que te inspira?</legend><div className="interest-list">{interests.map(interest =>
          <label className={`interest ${selected.includes(interest) ? 'selected' : ''}`} key={interest}>
            <input type="checkbox" checked={selected.includes(interest)} onChange={() => setSelected(current =>
              current.includes(interest) ? current.filter(item => item !== interest) : [...current, interest])} />{interest}
          </label>)}</div></fieldset>
        <p id="plan-hint" className="source">1–14 dias · orçamento positivo até R$ 1.000.000 · selecione ao menos um interesse.</p>
        <p className="source">Planejamento a partir de hoje. A previsão cobre somente as datas mostradas no painel; dias posteriores não têm previsão neste contexto.</p>
        <p className="source">Ao enviar, destino, orçamento, interesses e dados do painel serão processados pelo Google Gemini. Evite informações pessoais.</p>
        <button className="button primary full-width" disabled={planning || busyData} type="submit">{planning ? 'Gerando roteiro…' : 'Gerar roteiro com IA'}</button>
        {planning && <p role="status">Preparando sugestões para sua viagem…</p>}
        {planError && <ErrorMessage id="plan-error" message={planError} />}
      </form>
      <section className="panel ask-panel" aria-label="Pergunte sobre o destino">
        <div className="assistant-symbol" aria-hidden="true">✧</div><h3>Pergunte sobre {destination.location.city}</h3>
        <p className="muted">Uma ajudinha com a mala, os passeios ou os próximos dias?</p>
        <form onSubmit={event => { void submitQuestion(event) }}>
          <label htmlFor="travel-question">Sua pergunta</label><textarea id="travel-question" required minLength={3} maxLength={1000}
            value={question} onChange={event => setQuestion(event.target.value)} placeholder="O que devo levar na mala?" rows={4} aria-describedby={questionError ? 'question-error' : undefined} />
          <button className="button secondary full-width" disabled={asking || busyData || question.trim().length < 3} type="submit">{asking ? 'Pensando…' : 'Perguntar à IA'}</button>
        </form>
        {asking && <p role="status">Analisando o contexto do destino…</p>}
        {questionError && <ErrorMessage id="question-error" message={questionError} />}
        {answer && <div className="answer" role="status">{answer}</div>}
        <p className="source">A IA usa o destino atual e os dados disponíveis. Recomendações precisam de confirmação.</p>
      </section>
    </div>
    {plan && <AIResponse plan={plan} city={destination.location.city} />}
  </section>
}
