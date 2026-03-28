import { useNavigate } from "react-router-dom";
import { BookOpen, Heart, Info, Globe, ChevronLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

const About = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background lg:bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between bg-background/95 lg:bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-7 h-7 text-[#0f3c6e]" />
        </Button>
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#0f3c6e] font-serif">About Panchjanya</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-5xl mx-auto py-6 md:py-12 px-6 space-y-10 md:space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest border border-primary/20">
            <BookOpen className="w-4 h-4" />
            Panchjanya Presents
          </div>
          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-black text-foreground tracking-tighter italic">
            About Panchjanya
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium italic">
            "A digital pilgrimage experience, preserving the sacred architecture and spiritual essence of Bharat's heritage."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Mission */}
          <div className="bg-card p-6 md:p-10 rounded-[2.5rem] border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 text-primary/5 text-8xl font-heading select-none group-hover:scale-110 transition-transform">
              M
            </div>
            <Heart className="w-10 h-10 text-primary mb-6" />
            <h2 className="font-heading text-3xl font-bold mb-4 text-foreground italic lowercase">
              Our Mission
            </h2>
            <p className="text-muted-foreground leading-[1.8] text-base">
              We aim to preserve and promote the rich cultural and spiritual heritage of temples, making it accessible to devotees,
              researchers, and travelers alike. Panchjanya is a portal to the divine architecture of our ancestors.
            </p>
          </div>

          {/* Global Impact */}
          <div className="bg-card p-6 md:p-10 rounded-[2.5rem] border border-border shadow-sm relative overflow-hidden group text-left">
            <div className="absolute top-0 right-0 p-6 text-primary/5 text-8xl font-heading select-none group-hover:scale-110 transition-transform">
              G
            </div>
            <Globe className="w-10 h-10 text-secondary mb-6" />
            <h2 className="font-heading text-3xl font-bold mb-4 text-foreground italic lowercase">
              Digital Dharma
            </h2>
            <p className="text-muted-foreground leading-[1.8] text-base">
              By connecting tradition with technology, we empower the global Hindu diaspora to explore and stay connected
              to their roots through interactive maps, detailed archives, and visual storytelling.
            </p>
          </div>
        </div>

        {/* Features Showcase */}
        <div className="bg-secondary/10 p-6 md:p-12 rounded-[3.5rem] border border-secondary/20">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-center mb-8 md:mb-12 italic lowercase">
            Digital Heritage Tools
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Sacred Maps", desc: "Interactive sthana discovery", icon: "🗺️" },
              { title: "Vastu Vidya", desc: "Digital architectural archives", icon: "🏛️" },
              { title: "Yatra Routes", desc: "Precise navigation to temples", icon: "🛤️" },
              { title: "Real-time Sync", desc: "Always updated information", icon: "🔄" }
            ].map((feature, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="text-4xl mb-4 transition-transform hover:scale-125 duration-300 transform inline-block cursor-default">
                  {feature.icon}
                </div>
                <h3 className="font-heading font-bold text-lg">{feature.title}</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-background p-6 md:p-10 rounded-[2.5rem] border-2 border-dashed border-border text-center">
          <Info className="w-12 h-12 text-accent mx-auto mb-6" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold mb-4 text-foreground italic lowercase">
            Connect with the Archive
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-loose italic text-sm md:text-base">
            For suggestions, corrections, or to contribute to our digital library of sacred sthanas, please reach out.
            Together, we preserve the path of Dharma.
          </p>
        </div>

        <div className="text-center pt-8 text-[10px] text-muted-foreground uppercase tracking-[0.4em]">
          Panchjanya Project • 2026
        </div>
      </div>
    </div>
  );
};

export default About;
