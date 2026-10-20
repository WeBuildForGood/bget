import { JsonLd } from "@/components/seo/json-ld";

const faqs = [
  {
    q: "What is Build For Good?",
    a: "Build For Good is a global, multidisciplinary community where exceptional people across science, medicine, engineering, art, law, agriculture, and technology turn meaningful problems into collective action — guided by character first.",
  },
  {
    q: "How do you join the community?",
    a: "Apply through our membership process: submit your story, have a real conversation with us, complete a 30-day trial, and become a confirmed member — or bring a problem and join a Lab without membership.",
  },
  {
    q: "What kinds of problems do you solve?",
    a: "Every field that can help: health, energy, water, education, climate, software, cybersecurity, business strategy, philosophy, design, and more — anything real people face.",
  },
  {
    q: "Is membership selective?",
    a: "Yes. Character is the gate, not credentials. We review against twelve dimensions — honesty, kindness, curiosity, ambition, competence, humility, critical thinking, collaboration, responsibility, discipline, growth mindset, and positive intent.",
  },
];

export function HomepageFaq() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <section id="faq" className="relative py-16 lg:py-24 bg-[oklch(0.09_0.01_260)] text-white">
      <JsonLd data={faqSchema} />
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <h2 className="text-4xl sm:text-5xl lg:text-7xl font-display tracking-tight leading-[0.9] mb-12">
          Common questions<br />
          <span className="text-white/30">about Build For Good.</span>
        </h2>
        <div className="grid lg:grid-cols-2 gap-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="p-6 sm:p-8 border border-white/10 bg-transparent">
              <h3 className="text-xl font-display mb-3">{faq.q}</h3>
              <p className="text-white/60 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
