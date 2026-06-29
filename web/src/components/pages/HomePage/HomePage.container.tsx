import HomePage from './HomePage'

function HomePageContainer() {
  // Aquí se conectarán hooks/estado cuando se necesite lógica de datos
  const title = 'home.title'
  const subtitle = 'home.subtitle'

  return <HomePage title={title} subtitle={subtitle} />
}

export default HomePageContainer
