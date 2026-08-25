// ============================================================
// SIGNAL ARENA — ONBOARDING SCREEN
// 4-step intro with animations
// ============================================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Swords, BookOpen, Trophy, Brain } from 'lucide-react';
import type { Screen } from '../App';
import { useT } from '../i18n';
import { C } from '../lib/gameState';

interface OnboardingProps {
  setScreen: (s: Screen) => void;
}

const STEPS = [
  { icon: <Swords size={48} />, color: C.signal, titleKey: 'onboarding.step1_title', descKey: 'onboarding.step1_desc', glyph: '⚔️' },
  { icon: <BookOpen size={48} />, color: C.long, titleKey: 'onboarding.step2_title', descKey: 'onboarding.step2_desc', glyph: '📚' },
  { icon: <Trophy size={48} />, color: C.gold, titleKey: 'onboarding.step3_title', descKey: 'onboarding.step3_desc', glyph: '🏆' },
  { icon: <Brain size={48} />, color: C.grape, titleKey: 'onboarding.step4_title', descKey: 'onboarding.step4_desc', glyph: '🧠' },
];

export function Onboarding({ setScreen }: OnboardingProps) {
  const { t } = useT();
  const [step, setStep] = useState(0);
  
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="panel p-8 max-w-lg w-full text-center"
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              className={`h-2 rounded-full transition-all ${i === step ? 'w-8' : 'w-2'}`}
              style={{ background: i === step ? current.color : 'var(--edge)' }}
              animate={{ width: i === step ? 32 : 8 }}
            />
          ))}
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-6xl mb-6" style={{ filter: `drop-shadow(0 0 20px ${current.color})` }}>
              {current.glyph}
            </div>
            <h2 className="font-display text-xl font-black uppercase mb-3" style={{ color: current.color }}>
              {t(current.titleKey)}
            </h2>
            <p className="text-sm text-[var(--inkSoft)] leading-relaxed">
              {t(current.descKey)}
            </p>
          </motion.div>
        </AnimatePresence>
        
        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            className={`btn-ghost px-4 py-2 ${step === 0 ? 'invisible' : ''}`}
          >
            <ChevronLeft size={16} />
          </button>
          
          {isLast ? (
            <button
              onClick={() => setScreen('home')}
              className="btn-primary px-8 py-3 text-base font-bold"
            >
              {t('onboarding.lets_go')} 🚀
            </button>
          ) : (
            <button
              onClick={() => setStep(step + 1)}
              className="btn-primary px-6 py-2"
            >
              {t('common.next')} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
