import { Container, Paper } from "@mui/material";
import { type ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  textAlign?: "left" | "center" | "right";
}

export default function PageLayout({
  title,
  children,
  maxWidth = "xs",
  textAlign = "left",
}: PageLayoutProps) {
  return (
    <Container
      maxWidth={maxWidth}
      disableGutters
      sx={{
        mt: 6,
        px: { xs: 1, sm: 2 },
        width: "100%",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 4 },
          textAlign,
          width: "100%",
          maxWidth: { xs: "100%", sm: 420 },
          mx: "auto",
          boxSizing: "border-box",
        }}
      >
        {/* Removed default heading to avoid duplicate headings */}
        {children}
      </Paper>
    </Container>
  );
}
