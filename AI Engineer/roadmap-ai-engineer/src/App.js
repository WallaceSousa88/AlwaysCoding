import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <div className="App-nav">
          <img src={logo} className="App-logo" alt="logo" />
          <nav>
            <ul>
              <li><a href="#introduction">Introdução</a></li>
              <li><a href="#pre-trained-models">Using Pre-trained Models</a></li>
              <li><a href="#openai-api">OpenAI API</a></li>
              <li><a href="#ai-safety-ethics">AI Safety and Ethics</a></li>
              <li><a href="#opensource-ai">OpenSource AI</a></li>
              <li><a href="#embeddings-vector-databases">Embeddings & Vector Databases</a></li>
              <li><a href="#rag-implementation">RAG & Implementation</a></li>
              <li><a href="#ai-agents">AI Agents</a></li>
              <li><a href="#multimodal-ai">Multimodal AI</a></li>
              <li><a href="#development-tools">Development Tools</a></li>
            </ul>
          </nav>
        </div>
        <h1>Importância da Engenharia de IA no Desenvolvimento de Produtos</h1>
        <p>
          A engenharia de IA transforma o desenvolvimento de produtos automatizando tarefas, melhorando a tomada de decisões baseada em dados e possibilitando a criação de produtos mais inteligentes e personalizados. Ela acelera os ciclos de design, otimiza processos e permite a manutenção preditiva, controle de qualidade e gerenciamento eficiente de recursos. Ao integrar a IA, as empresas podem inovar mais rapidamente, reduzir custos e melhorar a experiência do usuário, proporcionando uma vantagem competitiva no mercado.
        </p>
        <p>
          A motivação para este projeto é criar uma fonte de aprendizado contínuo e aplicada, permitindo que eu entenda na prática como a IA pode revolucionar diferentes áreas. Compartilhando esse conhecimento, espero inspirar outras pessoas a explorar e se aprofundar no campo da inteligência artificial.
        </p>
      </header>
      <footer className="App-footer">
        <p>
          Este website faz parte de um projeto onde estou seguindo a trilha de aprendizado do <a href="https://roadmap.sh/ai-engineer" target="_blank" rel="noopener noreferrer">roadmap de AI Engineer</a>.<br></br> A cada etapa desenvolvida, vou salvar o conteúdo aqui, permitindo acompanhamento e compartilhamento do aprendizado.
        </p>
      </footer>
    </div>
  );
}

export default App;