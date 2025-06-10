import { Box, Typography, IconButton, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import GitHubIcon from "@mui/icons-material/GitHub";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import HomeIcon from "@mui/icons-material/Home";

/**
 * Footer component with simplified layout and scroll-to-top functionality
 * @returns JSX element containing footer with 4 icons and copyright text in single row
 */
export default function Footer() {
  const navigate = useNavigate();

  /**
   * Scrolls to top of page with smooth animation
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  /**
   * Navigates to home page
   */
  const goToHome = () => {
    navigate("/");
  };

  return (
    <Box
      sx={{
        py: { xs: 0.25, sm: 0.5 },
        px: { xs: 1, sm: 2 },
        bgcolor: "background.default",
        color: "text.secondary",
        width: "100%",
        minHeight: { xs: 40, sm: 48 },
        display: "flex",
        alignItems: "center",
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="center"
        sx={{ width: "100%" }}
      >
        {/* Arrow Up Icon - Scroll to Top */}
        <IconButton
          onClick={scrollToTop}
          aria-label="Scroll to top"
          color="inherit"
          size="small"
        >
          <ArrowCircleUpIcon fontSize="medium" />
        </IconButton>

        {/* Home Icon - Navigate to Home */}
        <IconButton
          onClick={goToHome}
          aria-label="Go to home"
          color="inherit"
          size="small"
        >
          <HomeIcon fontSize="medium" />
        </IconButton>

        {/* Animated Copyright Text */}
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 700,
            fontSize: '1rem',
            background: 'linear-gradient(45deg, #1976d2, #42a5f5, #1976d2, #42a5f5)',
            backgroundSize: '400% 400%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            animation: 'shimmer 3s ease-in-out infinite',
            '@keyframes shimmer': {
              '0%': {
                backgroundPosition: '0% 50%'
              },
              '50%': {
                backgroundPosition: '100% 50%'
              },
              '100%': {
                backgroundPosition: '0% 50%'
              }
            }
          }}
        >
          QUIZZARD
        </Typography>

        {/* GitHub Icon */}
        <IconButton
          component="a"
          href="https://github.com/SimeonTsvetanov"
          target="_blank"
          rel="noopener"
          aria-label="GitHub"
          color="inherit"
          size="small"
        >
          <GitHubIcon fontSize="medium" />
        </IconButton>

        {/* Buy Me Coffee Icon */}
        <IconButton
          component="a"
          href="https://buymeacoffee.com/simeontsvetanov"
          target="_blank"
          rel="noopener"
          aria-label="Support Me"
          color="inherit"
          size="small"
        >
          <LocalCafeIcon fontSize="medium" />
        </IconButton>
      </Stack>
    </Box>
  );
}
