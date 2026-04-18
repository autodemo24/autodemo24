/* eslint-disable @next/next/no-img-element */
import Home2SearchBar from './Home2SearchBar';

export default function Home2() {
  const categorie = [
    {
      label: 'Gomme',
      href: '/ricerca?q=gomme',
      img: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&auto=format&fit=crop',
    },
    {
      label: 'Fari',
      href: '/ricerca?q=faro',
      img: 'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=800&q=80&auto=format&fit=crop',
    },
    {
      label: 'Carrozzeria',
      href: '/ricerca?q=carrozzeria',
      img: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80&auto=format&fit=crop',
    },
    {
      label: 'Motori',
      href: '/ricerca?q=motore',
      img: 'https://images.unsplash.com/photo-1486496572940-2bb2341fdbdf?w=800&q=80&auto=format&fit=crop',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="w-full bg-white">
        <div className="max-w-5xl mx-auto px-6 h-24 flex items-center justify-between">
          <a href="/home2" aria-label="Autigo" className="flex items-center">
            <svg viewBox="0 0 326 170" xmlns="http://www.w3.org/2000/svg" className="h-16" aria-label="Autigo">
              <path fill="#4E92F5" transform="translate(10.00,86)" d="M 45.906 -11.000 L 21.797 -11.000 L 17.938 0.000 L 1.469 0.000 L 24.844 -64.500 L 43.062 -64.500 L 66.422 0.000 L 49.766 0.000 Z M 41.859 -23.000 L 33.859 -46.906 L 25.938 -23.000 Z"/>
              <path fill="#E8620A" transform="translate(73.00,90)" d="M 56.016 -51.000 L 56.016 0.000 L 40.000 0.000 L 40.000 -7.266 Q 37.641 -3.750 33.594 -1.625 Q 29.547 0.500 24.625 0.500 Q 18.828 0.500 14.367 -2.102 Q 9.906 -4.703 7.453 -9.633 Q 5.000 -14.562 5.000 -21.234 L 5.000 -51.000 L 21.016 -51.000 L 21.016 -23.719 Q 21.016 -18.688 23.578 -15.891 Q 26.141 -13.094 30.469 -13.094 Q 34.875 -13.094 37.438 -15.891 Q 40.000 -18.688 40.000 -23.719 L 40.000 -51.000 Z"/>
              <path fill="#F4B400" transform="translate(130.00,84)" d="M 34.000 -13.594 L 34.000 0.000 L 26.031 0.000 Q 17.516 0.000 12.758 -4.094 Q 8.000 -8.188 8.000 -17.453 L 8.000 -37.406 L 2.000 -37.406 L 2.000 -51.000 L 8.000 -51.000 L 8.000 -64.000 L 24.016 -64.000 L 24.016 -51.000 L 34.000 -51.000 L 34.000 -37.406 L 24.016 -37.406 L 24.016 -17.734 Q 24.016 -15.531 25.070 -14.562 Q 26.125 -13.594 28.609 -13.594 Z"/>
              <path fill="#92c522" transform="translate(162.00,90)" d="M 4.000 -65.438 Q 4.000 -69.141 6.664 -71.570 Q 9.328 -74.000 13.547 -74.000 Q 17.656 -74.000 20.328 -71.570 Q 23.000 -69.141 23.000 -65.438 Q 23.000 -61.859 20.328 -59.430 Q 17.656 -57.000 13.547 -57.000 Q 9.328 -57.000 6.664 -59.430 Q 4.000 -61.859 4.000 -65.438 Z M 21.016 -51.000 L 21.016 0.000 L 5.000 0.000 L 5.000 -51.000 Z"/>
              <path fill="#4E92F5" transform="translate(184.00,90)" d="M 41.000 -43.656 L 41.000 -51.000 L 57.016 -51.000 L 57.016 -0.188 Q 57.016 6.844 54.219 12.547 Q 51.422 18.250 45.695 21.625 Q 39.969 25.000 31.422 25.000 Q 20.062 25.000 13.000 19.633 Q 5.938 14.266 4.938 5.078 L 20.453 5.078 Q 21.172 8.016 23.875 9.711 Q 26.578 11.406 30.547 11.406 Q 35.312 11.406 38.156 8.609 Q 41.000 5.812 41.000 -0.312 L 41.000 -7.531 Q 38.734 -3.969 34.734 -1.734 Q 30.734 0.500 25.359 0.500 Q 19.094 0.500 14.000 -2.711 Q 8.906 -5.922 5.953 -11.859 Q 3.000 -17.797 3.000 -25.578 Q 3.000 -33.375 5.953 -39.266 Q 8.906 -45.156 14.000 -48.328 Q 19.094 -51.500 25.359 -51.500 Q 30.734 -51.500 34.781 -49.336 Q 38.828 -47.172 41.000 -43.656 Z M 30.016 -37.906 Q 25.406 -37.906 22.211 -34.617 Q 19.016 -31.328 19.016 -25.578 Q 19.016 -19.828 22.211 -16.461 Q 25.406 -13.094 30.016 -13.094 Q 34.609 -13.094 37.805 -16.422 Q 41.000 -19.750 41.000 -25.500 Q 41.000 -31.250 37.805 -34.578 Q 34.609 -37.906 30.016 -37.906 Z"/>
              <path fill="#E8620A" transform="translate(242.00,86)" d="M 3.000 -25.484 Q 3.000 -33.281 6.469 -39.219 Q 9.938 -45.156 15.977 -48.328 Q 22.016 -51.500 29.500 -51.500 Q 37.000 -51.500 43.031 -48.328 Q 49.062 -45.156 52.539 -39.219 Q 56.016 -33.281 56.016 -25.484 Q 56.016 -17.719 52.500 -11.781 Q 48.984 -5.844 42.898 -2.672 Q 36.812 0.500 29.328 0.500 Q 21.828 0.500 15.836 -2.672 Q 9.844 -5.844 6.422 -11.734 Q 3.000 -17.625 3.000 -25.484 Z M 40.000 -25.500 Q 40.000 -31.484 36.977 -34.695 Q 33.953 -37.906 29.516 -37.906 Q 24.984 -37.906 22.000 -34.742 Q 19.016 -31.578 19.016 -25.500 Q 19.016 -19.516 21.961 -16.305 Q 24.906 -13.094 29.344 -13.094 Q 33.766 -13.094 36.883 -16.305 Q 40.000 -19.516 40.000 -25.500 Z"/>
            </svg>
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="flex items-center gap-2 px-4 h-10 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="8" r="4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 21a8 8 0 0116 0" />
              </svg>
              Accedi
            </a>
            <button
              type="button"
              className="flex items-center gap-2 px-4 h-10 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* Hero con gradient soft */}
        <section className="w-full bg-gradient-to-b from-[#f7f8fa] to-[#eef1f5]">
          <div className="max-w-5xl mx-auto px-6 pt-12 pb-20">
            <h1 className="text-[32px] sm:text-[40px] leading-[1.15] font-bold tracking-tight text-gray-900">
              Il marketplace dei ricambi auto usati
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-gray-900">
              Confronta ricambi da migliaia di demolitori in tutta Italia
            </p>

            <div className="mt-10">
              <Home2SearchBar />
            </div>
          </div>
        </section>

        {/* Categorie più ricercate */}
        <section className="w-full bg-white">
          <div className="max-w-5xl mx-auto px-6 pt-14 pb-20">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Categorie più ricercate
            </h2>

            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
              {categorie.map((c) => (
                <a
                  key={c.label}
                  href={c.href}
                  className="group block"
                >
                  <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 border border-gray-100">
                    <img
                      src={c.img}
                      alt={c.label}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-3 text-center text-base font-semibold text-gray-900">
                    {c.label}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
