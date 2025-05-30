import Image from 'next/image';
import { Brain, Upload, Settings, Clock } from 'lucide-react';

export function FeatureSection() {
  const features = [
    {
      icon: <Upload className="h-10 w-10 text-primary" />,
      title: "Easy File Upload",
      description: "Upload PDFs, Word documents, and text files with our intuitive drag-and-drop interface."
    },
    {
      icon: <Brain className="h-10 w-10 text-primary" />,
      title: "AI-Powered Generation",
      description: "Our advanced AI analyzes your content and generates challenging, relevant questions across various formats."
    },
    {
      icon: <Settings className="h-10 w-10 text-primary" />,
      title: "Fully Customizable",
      description: "Control question types, difficulty levels, and exam structure to match your specific needs."
    },
    {
      icon: <Clock className="h-10 w-10 text-primary" />,
      title: "Save Hours of Work",
      description: "Create professional exams in minutes instead of hours with our powerful AI assistant."
    }
  ];

  return (
    <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Features that Transform Exam Creation</h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our AI-powered platform makes creating high-quality exams faster and easier than ever before.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 pt-12 md:pt-16">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm transition-all hover:shadow-md">
              {feature.icon}
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-center text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 lg:mt-24 grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div>
            <h3 className="text-2xl font-bold mb-4">Intelligent Question Generation</h3>
            <p className="text-muted-foreground mb-6">
              Our AI doesn't just extract questions from your content - it understands context, identifies key concepts, and creates original questions that test true comprehension.
            </p>
            <ul className="space-y-2">
              {[
                "Multiple choice, true/false, short answer, and essay questions",
                "Adjustable difficulty levels from basic recall to advanced analysis",
                "Custom weighting for different topics and concepts",
                "Automatic answer key generation for quick grading"
              ].map((item, i) => (
                <li key={i} className="flex items-start">
                  <svg
                    className="mr-2 h-5 w-5 text-primary flex-shrink-0"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border bg-background p-2 shadow-lg">
            <Image 
              src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg" 
              alt="AI Question Generation" 
              width={600} 
              height={400} 
              className="rounded shadow-sm"
            />
          </div>
        </div>
      </div>
    </section>
  );
}