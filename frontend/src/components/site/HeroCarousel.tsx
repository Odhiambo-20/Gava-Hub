import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import heroImage1 from "@/assets/hero-carousel/hero-01.jpg";
import heroImage2 from "@/assets/hero-carousel/hero-02.jpg";
import heroImage3 from "@/assets/hero-carousel/hero-03.jpg";
import heroImage4 from "@/assets/hero-carousel/hero-04.jpg";
import heroImage5 from "@/assets/hero-carousel/hero-05.jpg";
import heroImage6 from "@/assets/hero-carousel/hero-06.jpg";
import heroImage7 from "@/assets/hero-carousel/hero-07.jpg";

const backgroundImages = [
  {
    src: heroImage1,
    alt: "Professionals collaborating around a conference table",
    position: "center 75%",
    eyebrow: "For employers",
    heading: "Build trust into every hire.",
    description:
      "Review reliable candidate records and make confident hiring decisions with verified credentials.",
  },
  {
    src: heroImage2,
    alt: "Black women in technology reviewing equipment in a data center",
    position: "center 50%",
    eyebrow: "For professionals",
    heading: "Let your skills speak for you.",
    description:
      "Keep your qualifications and work experience together, ready to share with employers when opportunity comes.",
  },
  {
    src: heroImage3,
    alt: "Kenyan graduate in academic regalia",
    position: "center 22%",
    eyebrow: "For graduates",
    heading: "Turn your qualifications into opportunity.",
    description:
      "Build a trusted record of your education and give employers proof they can rely on.",
  },
  {
    src: heroImage4,
    alt: "Panoramic Nairobi city skyline",
    position: "center",
    fit: "contain",
    eyebrow: "Made for Kenya",
    heading: "A stronger future starts with trust.",
    description:
      "Connect Kenya’s talent, employers and institutions through secure, straightforward verification.",
  },
  {
    src: heroImage5,
    alt: "University of Nairobi graduate holding his diploma",
    position: "center 25%",
    eyebrow: "Your achievement, verified",
    heading: "Make your hard work count.",
    description:
      "Share trusted academic records with confidence, without repeatedly chasing paper documents.",
  },
  {
    src: heroImage6,
    alt: "Two colleagues working together at a computer",
    position: "center 50%",
    eyebrow: "Hiring made clearer",
    heading: "See the proof behind every profile.",
    description:
      "Review candidate credentials in one place and follow each verification from request to result.",
  },
  {
    src: heroImage7,
    alt: "African technology team collaborating at computers",
    position: "center 35%",
    eyebrow: "For institutions",
    heading: "Your records. Your authority. More trust.",
    description:
      "Confirm credentials your institution issued and help employers make decisions with confidence.",
  },
];

const ROTATION_INTERVAL = 4000;

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % backgroundImages.length);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Featured information"
      className="surface-navy relative isolate overflow-hidden"
    >
      {backgroundImages.map((image, index) => (
        <div key={image.src} className="contents">
          {image.fit === "contain" && (
            <img
              src={image.src}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 -z-10 h-full w-full scale-110 object-cover blur-md transition-opacity duration-1000 ${
                index === activeIndex ? "opacity-50" : "opacity-0"
              }`}
            />
          )}
          <img
            src={image.src}
            alt={index === activeIndex ? image.alt : ""}
            aria-hidden={index !== activeIndex}
            width={image.fit === "contain" ? 1850 : 1280}
            height={image.fit === "contain" ? 573 : 1600}
            style={{ objectPosition: image.position }}
            className={`absolute inset-0 -z-10 h-full w-full transition-opacity duration-1000 ${
              image.fit === "contain" ? "object-contain" : "object-cover"
            } ${index === activeIndex ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      ))}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-navy-deep/95 via-navy-deep/75 to-navy-deep/25" />

      <div className="mx-auto flex min-h-[38rem] max-w-7xl items-center px-5 py-16 md:min-h-[44rem] md:py-24">
        <div className="max-w-2xl pb-12">
          <span className="eyebrow text-leaf">
            <span className="h-px w-8 bg-current" />
            {backgroundImages[activeIndex].eyebrow}
          </span>
          <h1 className="mt-5 text-4xl font-bold text-primary-foreground md:text-6xl md:leading-[1.04]">
            {backgroundImages[activeIndex].heading}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-foreground/80">
            {backgroundImages[activeIndex].description}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-leaf px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-leaf-deep"
            >
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="rounded-lg border border-white/25 px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-white/10"
            >
              See how it works
            </Link>
          </div>
        </div>
      </div>

      {activeIndex === 3 && (
        <a
          href="https://commons.wikimedia.org/wiki/File:Kenya_-_Panorama_of_Nairobi_-_panoramio.jpg"
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-3 right-4 z-10 rounded bg-navy-deep/70 px-2 py-1 text-[0.65rem] text-white/80 hover:text-white"
        >
          Nairobi photo: Banja-Frans Mulder / Wikimedia Commons (CC BY 3.0)
        </a>
      )}

    </section>
  );
}
