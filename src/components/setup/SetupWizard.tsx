import { useState } from "react"
import { StoreInfoStep } from "./StoreInfoStep"
import { CatalogStep } from "./CatalogStep"
import { ReviewStep } from "./ReviewStep"
import { Sparkles } from "lucide-react"

export function SetupWizard() {
  const [step, setStep] = useState(1)

  const stepLabels = ["Store Info", "Catalog", "Review"]

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(232,185,49,0.08),transparent)]" />
      
      <div className="w-full max-w-4xl space-y-10 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mx-auto shadow-lg shadow-primary/20 mb-4">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-heading font-bold">
            Sales<span className="gradient-text">Desk</span>
          </h1>
          <p className="text-muted-foreground text-lg">Set up your store in 3 simple steps</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8 animate-in fade-in duration-500 delay-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-bold text-sm transition-all duration-500 ${
                    step > i
                      ? "bg-profit text-primary-foreground shadow-md shadow-profit/20"
                      : step === i
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110"
                        : "bg-surface border border-border text-muted-foreground"
                  }`}
                >
                  {step > i ? "✓" : i}
                </div>
                <span className={`text-xs font-medium transition-colors duration-300 ${step >= i ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                  {stepLabels[i - 1]}
                </span>
              </div>
              {i < 3 && (
                <div className="flex items-center px-3 md:px-6 pb-6">
                  <div className={`h-px w-12 md:w-20 transition-all duration-500 ${
                    step > i ? "bg-profit" : "bg-border"
                  }`} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="border border-border/40 rounded-2xl bg-card/80 shadow-2xl shadow-black/20 p-6 md:p-8 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500 delay-100">
          {step === 1 && <StoreInfoStep onNext={() => setStep(2)} />}
          {step === 2 && <CatalogStep onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <ReviewStep onBack={() => setStep(2)} />}
        </div>
      </div>
    </div>
  )
}
