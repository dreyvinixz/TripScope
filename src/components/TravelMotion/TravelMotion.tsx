import { InteractiveGlobe } from '../InteractiveGlobe/InteractiveGlobe'

export function TravelMotion({ onSelectCity }: { onSelectCity: (city: string) => void }) {

  return <section className="travel-motion no-print" aria-labelledby="travel-motion-title">
    <div className="motion-copy">
      <p className="eyebrow">EMBARQUE / 00:01</p>
      <h2 id="travel-motion-title">A viagem começa antes da chegada.</h2>
      <p>Uma leitura viva para escolher o próximo ponto, entender o contexto e seguir com mais intenção.</p>
    </div>
    <div className="motion-globe">
      <InteractiveGlobe onSelectCity={onSelectCity} />
      <span className="motion-caption">arraste · explore · escolha o próximo ponto</span>
    </div>
  </section>
}
