import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./components/Home";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Navbar />

      {/* Contenido principal crece para empujar el footer abajo */}
      <main className="flex-1 flex flex-col">
        <Home />
      </main>

      <Footer />
    </div>
  );
}
