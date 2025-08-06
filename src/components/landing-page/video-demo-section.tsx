export function VideoDemoSection() {
  return (
    <section className="relative z-10 px-3 sm:px-4 lg:px-8 pt-8 pb-16 sm:pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 border border-slate-700/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-8">
          <div className="aspect-video w-full">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/_B6nTvxtgI0"
              title="Demo do Lucida"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="rounded-lg sm:rounded-xl"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
