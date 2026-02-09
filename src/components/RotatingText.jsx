// src/components/RotatingText.jsx
import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RotatingText = forwardRef((props, ref) => {
  const {
    texts,
    transition = { type: 'spring', damping: 25, stiffness: 300 },
    initial = { y: '100%', opacity: 0 },
    animate = { y: 0, opacity: 1 },
    exit = { y: '-120%', opacity: 0 },
    rotationInterval = 2000,
    staggerDuration = 0,
    staggerFrom = 'first',
    loop = true,
    splitBy = 'characters',
    mainClassName = '',
    splitLevelClassName = '',
    elementLevelClassName = '',
    ...rest
  } = props;

  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const splitIntoCharacters = (text) => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
      return Array.from(segmenter.segment(text), (seg) => seg.segment);
    }
    return Array.from(text);
  };

  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex];
    if (splitBy === 'characters') {
      const words = currentText.split(' ');
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1,
      }));
    }
    return currentText.split(' ').map((word, i, arr) => ({
      characters: [word],
      needsSpace: i !== arr.length - 1,
    }));
  }, [texts, currentTextIndex, splitBy]);

  const getStaggerDelay = useCallback((index, total) => {
    if (staggerFrom === 'first') return index * staggerDuration;
    if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;
    if (staggerFrom === 'center') {
      const center = Math.floor(total / 2);
      return Math.abs(center - index) * staggerDuration;
    }
    return index * staggerDuration;
  }, [staggerFrom, staggerDuration]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTextIndex((prev) => {
        const next = prev + 1;
        return next >= texts.length ? (loop ? 0 : prev) : next;
      });
    }, rotationInterval);
    return () => clearInterval(intervalId);
  }, [texts.length, rotationInterval, loop]);

  return (
    <motion.span
      className={`rotating-text-container ${mainClassName}`}
      {...rest}
      layout
      transition={transition}
    >
      <span className="rotating-text-sr-only">{texts[currentTextIndex]}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={currentTextIndex}
          className="rotating-text-container"
          layout
          aria-hidden="true"
        >
          {elements.map((wordObj, wordIndex, array) => {
            const prevChars = array.slice(0, wordIndex).reduce((s, w) => s + w.characters.length, 0);
            const totalChars = array.reduce((s, w) => s + w.characters.length, 0);
            return (
              <span key={wordIndex} className={`rotating-text-word ${splitLevelClassName}`}>
                {wordObj.characters.map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(prevChars + charIndex, totalChars),
                    }}
                    className={`rotating-text-element ${elementLevelClassName}`}
                  >
                    {char}
                  </motion.span>
                ))}
                {wordObj.needsSpace && <span className="rotating-text-space"> </span>}
              </span>
            );
          })}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
});

RotatingText.displayName = 'RotatingText';
export default RotatingText;
