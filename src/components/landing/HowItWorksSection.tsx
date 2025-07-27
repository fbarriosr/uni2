
export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-background"> 
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-headline text-primary text-center mb-16">
          ¿Cómo Funciona UNI2?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 text-center items-start">
          <div className="flex flex-col items-center bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-md">
              1
            </div>
            <h3 className="text-xl font-headline text-foreground mb-3">Proponen</h3>
            <p className="text-muted-foreground">Padre e hijo navegan por las actividades y cada uno selecciona las que más le gustan para la próxima salida.</p>
          </div>
          <div className="flex flex-col items-center bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-md">
              2
            </div>
            <h3 className="text-xl font-headline text-foreground mb-3">Eligen</h3>
            <p className="text-muted-foreground">UNI2 revela las coincidencias. ¡Esas son las actividades finalistas! La decisión final es más fácil y emocionante que nunca.</p>
          </div>
          <div className="flex flex-col items-center bg-card p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-md">
              3
            </div>
            <h3 className="text-xl font-headline text-foreground mb-3">Conectan</h3>
            <p className="text-muted-foreground">Con un plan que les encanta a los dos, cada fin de semana se convierte en una aventura memorable y un lazo más fuerte.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
