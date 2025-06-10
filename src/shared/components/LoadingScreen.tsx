/**
 * LoadingScreen Component
 * 
 * Quick and fluent PWA loading screen with fast logo animation.
 * Provides a smooth app startup experience without unnecessary waiting.
 * 
 * Features:
 * - Very short animation duration (1 second total)
 * - Quick zoom-out animation
 * - Responsive design across all devices
 * - Follows Quizzard visual design system
 * - Auto-hides quickly after animation
 */

import { Box, Typography, Fade } from '@mui/material';
import { useState, useEffect } from 'react';
import quizzardPageLogo from '../assets/quizzard-page-logo.png';

interface LoadingScreenProps {
  /** Callback when loading animation completes */
  onAnimationComplete: () => void;
  /** Duration of the loading animation in milliseconds */
  duration?: number;
}

/**
 * LoadingScreen Component
 * 
 * Creates a quick startup animation for the PWA with the Quizzard logo
 * zooming out quickly and settling in the center.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  onAnimationComplete, 
  duration = 1000 // Much shorter - only 1 second
}) => {
  const [animationStage, setAnimationStage] = useState<'zoom' | 'fade' | 'complete'>('zoom');

  useEffect(() => {
    // Stage 1: Quick zoom animation (0.6s)
    const zoomTimer = setTimeout(() => {
      setAnimationStage('fade');
    }, duration * 0.6); // 60% of total duration for zoom

    // Stage 2: Quick fade and complete (0.4s)
    const completeTimer = setTimeout(() => {
      setAnimationStage('complete');
      onAnimationComplete();
    }, duration);

    return () => {
      clearTimeout(zoomTimer);
      clearTimeout(completeTimer);
    };
  }, [onAnimationComplete, duration]);

  if (animationStage === 'complete') {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        // iOS safe area support
        pt: 'max(0px, env(safe-area-inset-top))',
        pb: 'max(0px, env(safe-area-inset-bottom))',
        pl: 'max(0px, env(safe-area-inset-left))',
        pr: 'max(0px, env(safe-area-inset-right))',
      }}
    >
      {/* Quick Animated Logo */}
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Box
          component="img"
          src={quizzardPageLogo}
          alt="Quizzard"
          sx={{
            // Quick transition from large to small
            width: animationStage === 'zoom' ? { xs: '80vw', sm: '70vw', md: '60vw' } : { xs: '40%', sm: '35%', md: '30%' },
            height: 'auto',
            maxWidth: 'none', // Allow oversizing during zoom
            // Very fast and smooth transition
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)', // Bouncy easing for quick feel
            opacity: 1,
          }}
        />
      </Box>

      {/* Quick Text Fade - Only show briefly during fade stage */}
      <Fade in={animationStage === 'fade'} timeout={400}>
        <Box sx={{ 
          mt: 2, 
          textAlign: 'center',
          px: 2
        }}>
          {/* Loading Title - Theme provides Poppins font automatically */}
          <Typography
            variant="h4"
            sx={{
              // Font family inherited from theme typography system
              fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', // Fluid scaling for responsive design
              fontWeight: 700,
              color: 'primary.main',
              mb: 0.5,
            }}
          >
            Quizzard
          </Typography>
          
          {/* Loading Status - Consistent with theme typography */}
          <Typography
            variant="body1"
            sx={{
              // Font family and letter spacing inherited from theme
              fontSize: 'clamp(0.9rem, 2vw, 1rem)', // Fluid scaling for cross-device consistency
              color: 'text.secondary',
              fontWeight: 400,
              opacity: 0.7,
            }}
          >
            Ready!
          </Typography>
        </Box>
      </Fade>

      {/* Minimal background effect */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            radial-gradient(
              circle at center,
              transparent 0%,
              rgba(25, 118, 210, 0.02) 80%,
              rgba(25, 118, 210, 0.04) 100%
            )
          `,
          zIndex: -1,
        }}
      />
    </Box>
  );
}; 