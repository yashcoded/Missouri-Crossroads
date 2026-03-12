'use client';
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';

type Contributor = {
  name: string;
  title: string;
  org: string;
  email?: string;
};

type Slide = {
  title: string;
  eyebrow?: string;
  description: React.ReactNode;
  contributors?: Contributor[];
};

type TrackerSection = {
  id: string;
  title: string;
};

const slides: Slide[] = [
  {
    title: 'What is MOX?',
    description: `Missouri Crossroads (MOX) is a free, open-access digital platform mapping Missouri’s heritage landscape.

We survey, analyze, and connect more than 1,200 museums, archives, historic markers, and heritage organizations distributed across the state—visualizing them through an interactive map designed for use on any device, anywhere.

MOX was developed by an interdisciplinary team at the University of Missouri–St. Louis and Saint Louis University, combining expertise in public history, digital humanities, computer science, journalism, and geospatial analysis.

The platform is built on Where’s Religion?, an open-source digital humanities project developed at SLU with support from the Henry Luce Foundation, and has been adapted and rebranded for Missouri’s distinctive heritage ecosystem.`,
  },
  {
    title: 'Why it matters',
    description: `Missouri’s heritage resources are vast—and uneven. Preliminary research identified striking disparities in how heritage sites are represented, resourced, and digitally accessible across the state.

Some regions are well-documented; others contain institutions that lack the digital infrastructure, staff capacity, or visibility to reach the audiences they serve. MOX exists to document those gaps and help close them, by giving every site a presence, a data footprint, and a pathway to deeper engagement.`,
  },
  {
    title: 'How it works',
    description: `MOX combines structured, geotagged data with multimedia storytelling tools. Each site in our database carries standardized metadata encoded to Linked Open Data and Schema.org standards, making it machine-readable, interoperable, and built to last.

The platform supports oral histories, crowdsourced content, and participatory archival methods—designed not just to represent Missouri’s past, but to invite communities into the process of documenting it.

The platform’s codebase is published on GitHub under open-source licenses (Apache 2.0 / MIT) and is freely available for adaptation by other states, regions, or institutions pursuing similar public history goals.`,
  },
  {
    title: 'Who We Are',
    description:
      'Missouri Crossroads is a joint project of the UMSL History Department and the Center on Lived Religion at SLU, led by:',
    contributors: [
      {
        name: 'Laura M. Westhoff, Ph.D.',
        title: 'Professor & Chair, History',
        org: 'University of Missouri–St. Louis',
        email: 'westhoffL@umsl.edu',
      },
      {
        name: 'Adam Park, Ph.D.',
        title: 'Associate Director of Research',
        org: 'Center on Lived Religion, SLU',
        email: 'parkma@slu.edu',
      },
      {
        name: 'Yash Bhatia, M.S.',
        title: 'Tech Lead',
        org: 'Center on Lived Religion, SLU',
      },
      {
        name: 'David Pham, M.S.',
        title: 'Tech Lead',
        org: 'University of Missouri–St. Louis',
      },
      {
        name: 'John S. Forrester, M.A.',
        title: 'Content Creator',
        org: 'University of Missouri–St. Louis',
        email: 'jsfpnd@umsl.edu',
      },
    ],
  },
  {
    title: 'Explore the map',
    description: (
      <>
        You can browse all Missouri heritage sites directly on our interactive
        map. Click{' '}
        <Link href="/map" className="text-[#EAAB00] underline hover:text-white">
          here
        </Link>{' '}
        to explore.
      </>
    ),
  },
];

const trackerSections: TrackerSection[] = [
  {
    id: 'slide-landing',
    title: 'Home',
  },
  ...slides.map((slide, index) => ({
    id: `slide-${index}`,
    eyebrow: slide.eyebrow,
    title: slide.title,
  })),
];

const UMSL_RED = '#BA0C2F';
const UMSL_GOLD = '#EAAB00';

function StackCard({
  slide,
  index,
  setRef,
}: {
  slide: Slide;
  index: number;
  setRef?: (el: HTMLElement | null) => void;
}) {
  return (
    <section
      ref={setRef}
      id={`slide-${index}`}
      className="snap-start min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-8"
      style={{ scrollSnapStop: 'always' }}
    >
      <motion.article
        initial={{ opacity: 0, y: 40, scale: 0.97, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        viewport={{ amount: 0.4, once: false }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-5xl overflow-hidden rounded-2xl border bg-zinc-900/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-sm sm:rounded-3xl sm:p-8 md:p-10 lg:p-12"
        style={{
          borderColor: 'rgba(234, 171, 0, 0.18)',
          boxShadow:
            '0 25px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(186,12,47,0.14) 0%, rgba(234,171,0,0.08) 28%, rgba(255,255,255,0.02) 55%, transparent 100%)',
          }}
        />

        <div className="relative z-10">
          {slide.eyebrow && (
            <div
              className="mb-2 text-[11px] uppercase tracking-[0.2em] sm:mb-3 sm:text-sm"
              style={{ color: UMSL_GOLD }}
            >
              {slide.eyebrow}
            </div>
          )}

          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-white sm:mb-4 sm:text-3xl md:text-4xl lg:text-5xl">
            {slide.title}
          </h2>

          <p className="max-w-none whitespace-pre-line text-left text-sm leading-6 text-zinc-300 sm:text-base sm:leading-7 md:max-w-4xl md:text-lg md:leading-8">
            {slide.description}
          </p>

          {slide.contributors && (
            <div className="mt-6 border-t border-white/10 pt-5 sm:mt-8 sm:pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                {slide.contributors.map(person => (
                  <div
                    key={person.name}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-left sm:text-center"
                  >
                    <div className="inline-block border-b border-[#EAAB00]/40 pb-1 text-sm font-medium text-white sm:text-base">
                      {person.name}
                    </div>

                    <div className="mt-2 text-sm text-zinc-400">
                      {person.title}
                    </div>

                    <div className="mt-1 text-sm text-zinc-500">
                      {person.org}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between sm:mt-6">
            <div className="text-xs text-zinc-500 sm:text-sm">
              Slide {String(index + 1).padStart(2, '0')}
            </div>

            <div className="flex gap-2">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: i === index ? 24 : 8,
                    backgroundColor: i === index ? UMSL_GOLD : 'rgb(82 82 91)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.article>
    </section>
  );
}

function StickyPreviewTracker({
  sections,
  activeIndex,
}: {
  sections: TrackerSection[];
  activeIndex: number;
}) {
  return (
    <div className="pointer-events-none fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 xl:block">
      <div
        className="rounded-2xl border p-4 shadow-xl backdrop-blur-md"
        style={{
          background: 'rgba(9, 9, 11, 0.72)',
          borderColor: 'rgba(234,171,0,0.18)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
        }}
      >
        <div
          className="mb-4 text-[11px] uppercase tracking-[0.2em]"
          style={{ color: 'rgba(234,171,0,0.72)' }}
        >
          Preview
        </div>

        <div className="flex items-start gap-4">
          <div className="relative flex flex-col items-center gap-3 pt-1">
            <div className="absolute top-1 bottom-1 w-px bg-zinc-800" />

            {sections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                aria-label={`Go to section ${index + 1}`}
                className="pointer-events-auto relative"
                onClick={() => {
                  document
                    .getElementById(section.id)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <span
                  className="block rounded-full transition-all duration-300"
                  style={{
                    width: index === activeIndex ? 14 : 9,
                    height: index === activeIndex ? 14 : 9,
                    backgroundColor:
                      index === activeIndex ? UMSL_RED : 'rgb(82 82 91)',
                    boxShadow:
                      index === activeIndex
                        ? `0 0 0 4px rgba(234,171,0,0.18), 0 0 24px rgba(186,12,47,0.35)`
                        : 'none',
                  }}
                />
              </button>
            ))}
          </div>

          <div className="min-w-[180px]">
            <div className="mb-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
              {String(activeIndex + 1).padStart(2, '0')} /{' '}
              {String(sections.length).padStart(2, '0')}
            </div>

            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div
                className="text-xs uppercase tracking-[0.2em]"
                style={{ color: UMSL_GOLD }}
              ></div>

              <div className="mt-2 text-base font-semibold text-white">
                {sections[activeIndex]?.title}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

const WelcomePage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    slideRefs.current.forEach((el, index) => {
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveIndex(index);
          }
        },
        {
          threshold: 0.45,
        }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, []);

  return (
    <div className="relative h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-zinc-950">
      <StickyPreviewTracker
        sections={trackerSections}
        activeIndex={activeIndex}
      />

      <section
        ref={el => {
          slideRefs.current[0] = el;
        }}
        id="slide-landing"
        className="snap-start min-h-screen flex items-center justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-8"
        style={{ scrollSnapStop: 'always' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="mx-auto w-full max-w-6xl"
        >
          <div className="max-w-3xl">
            <p
              className="mb-3 text-[11px] uppercase tracking-[0.2em] sm:text-sm"
              style={{ color: UMSL_GOLD }}
            >
              University of Missouri - St. Louis
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
              Missouri Crossroads
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">
              Missouri Crossroads maps the state’s heritage landscape—connecting
              over 1,200 historic sites, museums, archives, and community
              organizations through an open, interactive platform built for
              researchers, educators, and the public.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <div
                className="h-2 w-16 rounded-full"
                style={{ backgroundColor: UMSL_RED }}
              />
              <div
                className="h-2 w-8 rounded-full"
                style={{ backgroundColor: UMSL_GOLD }}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {slides.map((slide, index) => (
        <StackCard
          key={slide.title}
          slide={slide}
          index={index}
          setRef={el => {
            slideRefs.current[index + 1] = el;
          }}
        />
      ))}
    </div>
  );
};

export default WelcomePage;
