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
    navigate("/random-team-generator");
  };

  const handleDisabledCardClick = () => {
    setSnackbarOpen(true);
  };

  return (
    <>
      <Box sx={{ 
        bgcolor: 'background.default',
        py: 2,
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
          gap: { xs: 3, sm: 4, md: 3 }, // Increased gaps for mobile (20% more)
          alignItems: 'center', // Center all elements
          textAlign: 'center' // Center all text
        }}>
          {/* Clean Logo - Website Style */}
          <Box
            component="img"
            src={quizzardPageLogo}
            alt="Quizzard Logo"
            sx={{
              width: { xs: 115, sm: 144, md: 144 }, // 20% bigger on mobile (96→115, 120→144)
              height: 'auto',
              // NO margin/padding - gap system handles spacing
            }}
          />

          {/* Main Heading - Direct Typography, no Box wrapper */}
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ 
              fontSize: { xs: '2.4rem', sm: '2.88rem', md: '2.8rem' }, // 20% bigger on mobile (2→2.4, 2.4→2.88)
              fontWeight: 700,
              // NO margin/padding - gap system handles spacing
            }}
          >
            Welcome to Quizzard
          </Typography>

          {/* Subtitle - Direct Typography, no Box wrapper */}
          <Typography 
            variant="h5" 
            sx={{ 
              fontSize: { xs: '1.08rem', sm: '1.2rem', md: '1.2rem' }, // 20% bigger on mobile (0.9→1.08, 1→1.2)
              color: 'text.secondary',
              maxWidth: '600px',
              // NO margin/padding - gap system handles spacing
            }}
          >
            Your all-in-one quiz and team tools suite
          </Typography>

          {/* Tool Cards Section */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 3, sm: 4, md: 3 }, // Increased gaps for mobile (20% more)
              width: '100%',
            }}
          >
            <ToolCard
              icon={<GroupsIcon sx={{ fontSize: { xs: 54, sm: 61, md: 58 }, color: "primary.main" }} />} // 20% bigger on mobile (45→54, 51→61)
              title="Random Team Generator"
              description="Quickly split people into random teams for any activity. Fair, unbiased, and instant."
              onClick={handleRandomTeamGenerator}
            />
            <ToolCard
              icon={<ScoreboardIcon sx={{ fontSize: { xs: 54, sm: 61, md: 58 }, color: "secondary.main" }} />} // 20% bigger on mobile (45→54, 51→61)
              title="Points Counter"
              description="Track and manage scores for games, quizzes, or events. Simple, fast, and reliable."
              onClick={handleDisabledCardClick}
              disabled
            />
            <ToolCard
              icon={<QuizIcon sx={{ fontSize: { xs: 54, sm: 61, md: 58 }, color: "info.main" }} />} // 20% bigger on mobile (45→54, 51→61)
              title="Quizzes"
              description="Build and play custom quizzes with friends or solo. Fun, interactive, and coming soon!"
              onClick={handleDisabledCardClick}
              disabled
            />
          </Box>
        </Box>
      </Box>

      {/* Snackbar for disabled cards - NOW AT TOP */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert 
          severity="info" 
          sx={{ 
            width: "100%",
            fontSize: { xs: '1.05rem', sm: '1.2rem', md: '1rem' }, // 20% bigger on mobile (0.875→1.05, 1→1.2)
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
