import Image from "next/image";

export function TestimonialSection() {
  const testimonials = [
    {
      quote:
        "Lucida has completely transformed how I create assessments. What used to take me hours now takes minutes, and the quality is exceptional.",
      author: "Dr. Sarah Johnson",
      title: "Professor of Biology, Stanford University",
      avatar:
        "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    {
      quote:
        "As someone who creates training materials regularly, Lucida has been a game-changer. The AI understands context remarkably well.",
      author: "Michael Chen",
      title: "Corporate Training Director, Global Solutions Inc.",
      avatar:
        "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
    {
      quote:
        "The time I save with Lucida allows me to focus more on teaching rather than test creation. It's an essential tool for modern educators.",
      author: "Emma Rodriguez",
      title: "High School Math Teacher",
      avatar:
        "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
    },
  ];

  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Trusted by Educators Worldwide
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              See why thousands of educators and trainers choose Lucida for
              their assessment needs.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 pt-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="flex flex-col justify-between rounded-xl bg-background p-6 shadow-sm"
            >
              <div>
                <svg
                  className="h-8 w-8 text-primary opacity-50"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                >
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                </svg>
                <p className="mt-4 text-lg">{testimonial.quote}</p>
              </div>
              <div className="mt-6 flex items-center">
                <Image
                  alt={testimonial.author}
                  className="rounded-full mr-4"
                  height={40}
                  src={testimonial.avatar}
                  style={{
                    aspectRatio: "40/40",
                    objectFit: "cover",
                  }}
                  width={40}
                />
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.title}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
