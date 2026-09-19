import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { CitizenAppealsSlide } from "@/slides/CitizenAppealsSlide"
import { EmployeeOfMonthSlide } from "@/slides/EmployeeOfMonthSlide"
import { PresidentQuoteSlide } from "@/slides/PresidentQuoteSlide"

import {
  getSlideSettings,
  subscribe,
  type SlideSettings,
} from "@/data/tvStore"

const TRANSITION_DURATION = 500

export function Slideshow() {
  const [settings, setSettings] =
    useState<SlideSettings>(() => getSlideSettings())

  const [currentSlide, setCurrentSlide] = useState(0)
  const [visible, setVisible] = useState(true)

  const transitionTimeout = useRef<number | null>(null)
  const transitionLocked = useRef(false)

  const slides = useMemo(() => {
    return [
      {
        id: "president",
        name: "Prezident fikri",
        component: PresidentQuoteSlide,
        enabled: settings.presidentEnabled,
      },
      {
        id: "appeals",
        name: "Fuqarolar murojaatlari",
        component: CitizenAppealsSlide,
        enabled: settings.appealsEnabled,
      },
      {
        id: "employee",
        name: "Oy xodimi",
        component: EmployeeOfMonthSlide,
        enabled: settings.employeeEnabled,
      },
    ].filter((slide) => slide.enabled)
  }, [settings])

  const changeSlide = useCallback(
    (direction: "next" | "previous") => {
      if (slides.length <= 1) return
      if (transitionLocked.current) return

      transitionLocked.current = true
      setVisible(false)

      if (transitionTimeout.current) {
        window.clearTimeout(transitionTimeout.current)
      }

      transitionTimeout.current = window.setTimeout(() => {
        setCurrentSlide((current) => {
          if (direction === "next") {
            return (current + 1) % slides.length
          }

          return (
            current - 1 + slides.length
          ) % slides.length
        })

        setVisible(true)
        transitionLocked.current = false
      }, TRANSITION_DURATION)
    },
    [slides.length]
  )

  const nextSlide = useCallback(() => {
    changeSlide("next")
  }, [changeSlide])

  const previousSlide = useCallback(() => {
    changeSlide("previous")
  }, [changeSlide])

  // Listen for settings changes from the Admin tab
  useEffect(() => {
    return subscribe("settings", () => {
      const newSettings = getSlideSettings()

      setSettings(newSettings)
      setCurrentSlide(0)
      setVisible(true)
      transitionLocked.current = false
    })
  }, [])

  // Safety if active slide count changes
  useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0)
    }
  }, [currentSlide, slides.length])

  // Automatic slideshow
  useEffect(() => {
    if (slides.length <= 1) {
      return
    }

    const duration =
      Math.max(settings.intervalSeconds, 5) * 1000

    const interval = window.setInterval(() => {
      nextSlide()
    }, duration)

    return () => {
      window.clearInterval(interval)
    }
  }, [
    settings.intervalSeconds,
    slides.length,
    nextSlide,
  ])

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        nextSlide()
      }

      if (event.key === "ArrowLeft") {
        previousSlide()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      )
    }
  }, [nextSlide, previousSlide])

  // Cleanup transition timeout
  useEffect(() => {
    return () => {
      if (transitionTimeout.current) {
        window.clearTimeout(
          transitionTimeout.current
        )
      }
    }
  }, [])

  if (slides.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9]">
        <p className="text-[14px] text-neutral-500">
          Faol slayd mavjud emas
        </p>
      </div>
    )
  }

  const CurrentSlide =
    slides[currentSlide]?.component ??
    slides[0].component

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAFAF9]">
      <div
        className={`transition-opacity ease-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          transitionDuration: `${TRANSITION_DURATION}ms`,
        }}
      >
        <CurrentSlide />
      </div>

      {/* DEVELOPMENT-ONLY INDICATOR */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-[18px] left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-[10px] rounded-full border border-black/10 bg-white/90 px-[14px] py-[8px] shadow-sm backdrop-blur">
            <span className="mr-[4px] text-[10px] font-semibold text-neutral-500">
              {slides[currentSlide]?.name}
            </span>

            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`h-[6px] rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "w-[22px] bg-[#1D4ED8]"
                    : "w-[6px] bg-neutral-300"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}