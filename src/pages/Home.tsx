import { Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ToolCard from "../shared/components/ToolCard";
import QuizIcon from "@mui/icons-material/Quiz";
import ScoreboardIcon from "@mui/icons-material/Scoreboard";
import GroupsIcon from "@mui/icons-material/Groups";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import quizzardPageLogo from "../shared/assets/quizzard-page-logo.png";

export default function Home() {
  const navigate = useNavigate();

  const handleRandomTeamGenerator = () => {
    navigate("/random-team-generator");
  };

  const handlePointsCounter = () => {
    navigate("/points-counter");
  };

  const handleQuizzes = () => {
    navigate("/quizzes");
  };

  return (
    <>
      <Box
        sx={{
          bgcolor: "background.default",
          py: 2,
          px: { xs: 1, sm: 2 },
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: {
              xs: "calc(100vw - 16px)",
              sm: "clamp(280px, 90vw, 1400px)", // Wider for the 3 cards layout
            },
            display: "flex",
            flexDirection: "column",
            gap: { xs: 3, sm: 4, md: 3 }, // Increased gaps for mobile (20% more)
            alignItems: "center", // Center all elements
            textAlign: "center", // Center all text
          }}
        >
          {/* Clean Logo - Website Style */}
          <Box
            component="img"
            src={quizzardPageLogo}
            alt="Quizzard Logo"
            sx={{
              width: { xs: 115, sm: 144, md: 144 }, // 20% bigger on mobile (96→115, 120→144)
              height: "auto",
              // NO margin/padding - gap system handles spacing
            }}
          />

          {/* Main Heading - Using fluid typography from theme */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              marginBottom: 0, // Override theme margin, use gap system
            }}
          >
            Welcome to Quizzard
          </Typography>

          {/* Subtitle - Using fluid typography from theme */}
          <Typography
            variant="h5"
            sx={{
              color: "text.secondary",
              maxWidth: "600px",
              marginBottom: 0, // Override theme margin, use gap system
            }}
          >
            Your all-in-one quiz and team tools suite
          </Typography>

          {/* Tool Cards Section - FIXED: Always centered on all screen sizes */}
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              justifyContent: "center",
              alignItems: "center", // FIXED: Always center the cards, both column and row layouts
              gap: { xs: 3, sm: 4, md: 3 }, // Increased gaps for mobile (20% more)
              width: "100%",
              maxWidth: { xs: "100%", lg: "1200px" }, // Prevent overflow on large screens
            }}
          >
            <ToolCard
              icon={
                <GroupsIcon
                  sx={{
                    fontSize: { xs: 54, sm: 61, md: 58 },
                    color: "primary.main",
                  }}
                />
              } // 20% bigger on mobile (45→54, 51→61)
              title="Random Team Generator"
              description="Quickly split people into random teams for any activity. Fair, unbiased, and instant."
              onClick={handleRandomTeamGenerator}
            />
            <ToolCard
              icon={
                <ScoreboardIcon
                  sx={{
                    fontSize: { xs: 54, sm: 61, md: 58 },
                    color: "secondary.main",
                  }}
                />
              } // 20% bigger on mobile (45→54, 51→61)
              title="Points Counter"
              description="Track and manage scores for games, quizzes, or events. Simple, fast, and reliable."
              onClick={handlePointsCounter}
            />
            <ToolCard
              icon={
                <HelpOutlineIcon
                  sx={{
                    fontSize: { xs: 54, sm: 61, md: 58 },
                    color: "warning.main",
                  }}
                />
              }
              title="Final Question"
              description="Break ties with a unique, AI-generated quiz question. Choose difficulty and language."
              onClick={() => navigate("/final-question")}
            />
            <ToolCard
              icon={
                <QuizIcon
                  sx={{
                    fontSize: { xs: 54, sm: 61, md: 58 },
                    color: "info.main",
                  }}
                />
              } // 20% bigger on mobile (45→54, 51→61)
              title="Quizzes"
              description="UNDER CONSTRUCTION!!!"
              onClick={handleQuizzes}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}
