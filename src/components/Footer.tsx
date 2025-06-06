import { Box, Typography, Link, IconButton, Stack } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import GitHubIcon from "@mui/icons-material/GitHub";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import quizzardLogo from "../assets/quizzard-logo.png";

const currentYear = new Date().getFullYear();

const navLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (    <Box
      component="footer"
      sx={{
        mt: 8,
        py: { xs: 3.5, sm: 4 }, // Increased padding to accommodate larger logo
        px: { xs: 1, sm: 2 },
        bgcolor: "background.paper",
        color: "text.secondary",
        fontSize: { xs: 13, sm: 15 },
        width: "100%",
        overflowX: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
        sx={{ maxWidth: 900, mx: "auto", width: "100%" }}
      >
        {" "}
        {/* Left: Copyright & Logo */}{" "}
        <Stack direction="row" alignItems="center" spacing={1}>
          {" "}
          <Box
            component="img"
            src={quizzardLogo}
            alt="Quizzard Logo"
            sx={{
              height: { xs: 29, sm: 33 },
              width: "auto",
              maxWidth: { xs: 29, sm: 33 },
              objectFit: "contain",
              mr: 1,
              flexShrink: 0,
              borderRadius: 1,
            }}
          />
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            &copy; {currentYear} Quizzard. All rights reserved.
          </Typography>
        </Stack>
        {/* Center: Navigation Links */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={{ xs: 0.5, sm: 2 }}
          alignItems="center"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              component={RouterLink}
              to={link.href}
              underline="hover"
              color="inherit"
              variant="body2"
              sx={{ px: 0.5, py: 0.5, fontWeight: 400 }}
            >
              {link.label}
            </Link>
          ))}
        </Stack>
        {/* Right: Social & Support */}
        <Stack direction="row" spacing={1} alignItems="center">
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
      </Stack>
    </Box>
  );
}
