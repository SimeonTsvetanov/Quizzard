import { Typography, Box, Snackbar, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ToolCard from "../shared/components/ToolCard";
import QuizIcon from "@mui/icons-material/Quiz";
import ScoreboardIcon from "@mui/icons-material/Scoreboard";
import GroupsIcon from "@mui/icons-material/Groups";
import quizzardPageLogo from "../shared/assets/quizzard-page-logo.png";

export default function Home() {
  const navigate = useNavigate();
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleRandomTeamGenerator = () => {
    navigate("/team-generator");
  };

  const handleDisabledCardClick = () => {
    setSnackbarOpen(true);
  };

  return (
    <>
      <Box sx={{ 
        bgcolor: 'background.default',
        py: 3,
        px: { xs: 1, sm: 2 },
        display: 'flex',
        justifyContent: 'center'
      }}>
        <Box sx={{ 
          width: '100%',
          maxWidth: { 
            xs: 'calc(100vw - 16px)', 
            sm: 'clamp(280px, 90vw, 1400px)' // Wider for the 3 cards layout
          },
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 3, sm: 4, md: 5 } // Unified gap system for all elements
        }}>
          {/* Clean Logo - Website Style */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center',
            alignItems: 'center',
            // No margin - let the unified gap system handle spacing
          }}>
            <Box
              component="img"
              src={quizzardPageLogo}
              alt="Quizzard Logo"
              sx={{
                width: { xs: 120, sm: 150, md: 180 }, // Small website logo size
                height: 'auto',
                // No styling - just clean logo
              }}
            />
          </Box>

          {/* Main Heading */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              component="h1" 
              sx={{ 
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                fontWeight: 700,
                mb: 0 // Remove individual margin, let gap system handle it
              }}
            >
              Welcome to Quizzard
            </Typography>
          </Box>

          {/* Subtitle */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
                color: 'text.secondary',
                maxWidth: '600px',
                mx: 'auto',
                mb: 0 // Remove individual margin, let gap system handle it
              }}
            >
              Your all-in-one quiz and team tools suite
            </Typography>
          </Box>

          {/* Tool Cards Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 3, sm: 4, md: 5 }, // Same unified gap system
              width: '100%',
            }}
          >
            <ToolCard
              icon={<GroupsIcon sx={{ fontSize: { xs: 56, sm: 64, md: 72 }, color: "primary.main" }} />}
              title="Random Team Generator"
              description="Quickly split people into random teams for any activity. Fair, unbiased, and instant."
              onClick={handleRandomTeamGenerator}
            />
            <ToolCard
              icon={<ScoreboardIcon sx={{ fontSize: { xs: 56, sm: 64, md: 72 }, color: "secondary.main" }} />}
              title="Points Counter"
              description="Track and manage scores for games, quizzes, or events. Simple, fast, and reliable."
              onClick={handleDisabledCardClick}
              disabled
            />
            <ToolCard
              icon={<QuizIcon sx={{ fontSize: { xs: 56, sm: 64, md: 72 }, color: "info.main" }} />}
              title="Quizzes"
              description="Build and play custom quizzes with friends or solo. Fun, interactive, and coming soon!"
              onClick={handleDisabledCardClick}
              disabled
            />
          </Box>
        </Box>
      </Box>

      {/* Snackbar for disabled cards */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          severity="info" 
          sx={{ 
            width: "100%",
            fontSize: { xs: '0.875rem', sm: '1rem' },
            '& .MuiAlert-message': {
              fontWeight: 500,
            }
          }}
        >
          Still Under Construction
        </Alert>
      </Snackbar>
    </>
  );
}
