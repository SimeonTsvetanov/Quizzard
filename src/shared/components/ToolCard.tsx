import { Card, CardActionArea, Typography, Box } from "@mui/material";
import { type ReactNode } from "react";

interface ToolCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function ToolCard({ icon, title, description, onClick, disabled = false }: ToolCardProps) {
  return (
    <Card
      elevation={disabled ? 2 : 4}
      sx={{
        borderRadius: 3,
        // FIXED: Consistent width and NO mobile overflow
        width: { xs: '100%', sm: '100%', md: 280, lg: 256, xl: 304 },
        maxWidth: { xs: 384, sm: 384, md: 320, lg: 320, xl: 320 },
        // FIXED: All cards same height (as tall as the tallest card)
        height: { xs: 280, sm: 320, md: 280 }, // Fixed height ensures all cards match
        transition: "transform 0.15s, box-shadow 0.15s",
        opacity: disabled ? 0.7 : 1,
        cursor: 'pointer',
        '&:hover': disabled ? {
          transform: 'translateY(-2px)',
        } : {
          boxShadow: 8,
          transform: 'translateY(-4px) scale(1.03)',
        },
      }}
    >
      <CardActionArea 
        onClick={onClick}
        sx={{ 
          p: { xs: 1.92, sm: 2.88, md: 2.4 },
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          justifyContent: 'space-between', // FIXED: Distribute content evenly in fixed height
          height: '100%', // Fill the entire card height
          gap: { xs: 1, sm: 1.5, md: 1.2 }, // Slightly adjusted gaps for better distribution
          WebkitTapHighlightColor: 'transparent',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          '& .MuiTouchRipple-root': {
            color: disabled ? 'rgba(0, 0, 0, 0.2)' : 'primary.main',
          },
          '& .MuiTouchRipple-child': {
            backgroundColor: disabled ? 'rgba(0, 0, 0, 0.1)' : 'currentColor',
          },
          '&:focus': { 
            outline: 'none',
            '& .MuiCardActionArea-focusHighlight': {
              opacity: 0,
            }
          },
          '&:focus-visible': { 
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
        TouchRippleProps={{
          style: {
            color: disabled ? 'rgba(0, 0, 0, 0.1)' : undefined,
          }
        }}
      >
        {/* Icon Section - Top */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: { xs: 58, sm: 70, md: 64 },
          flexShrink: 0
        }}>
          {icon}
        </Box>
        
        {/* Text Content Section - Center with consistent spacing */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: { xs: 1, sm: 1.2, md: 1 },
          flex: 1, // Take remaining space
          justifyContent: 'center' // Center the text content vertically
        }}>
          {/* Card Title - Using fluid typography from theme for consistent scaling */}
          <Typography 
            variant="h5" 
            component="div" 
            fontWeight={700}
            sx={{
              fontSize: 'clamp(1.2rem, 2.5vw, 1.4rem)', // Modern fluid scaling replaces manual breakpoints
              textAlign: 'center',
              // Theme automatically provides Poppins font family
            }}
          >
            {title}
          </Typography>
          
          {/* Card Description - Enhanced with fluid scaling and better readability */}
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)', // Fluid scaling for better cross-device consistency
              lineHeight: 1.6, // Improved readability (was 1.5)
              textAlign: 'center',
              // Theme automatically provides Poppins font family and optimal letter spacing
            }}
          >
            {description}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
} 