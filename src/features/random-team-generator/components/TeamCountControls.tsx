import React from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  TextField,
  Paper
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

interface TeamCountControlsProps {
  teamCount: number;
  onTeamCountChange: (count: number) => void;
  participantCount: number;
}

export default function TeamCountControls({
  teamCount,
  onTeamCountChange,
  participantCount
}: TeamCountControlsProps) {
  const maxTeams = Math.min(participantCount, 20);
  const minTeams = 2;

  const handleDecrease = () => {
    if (teamCount > minTeams) {
      onTeamCountChange(teamCount - 1);
    }
  };

  const handleIncrease = () => {
    if (teamCount < maxTeams) {
      onTeamCountChange(teamCount + 1);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= minTeams && value <= maxTeams) {
      onTeamCountChange(value);
    }
  };

  const handleInputBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (isNaN(value) || value < minTeams) {
      onTeamCountChange(minTeams);
    } else if (value > maxTeams) {
      onTeamCountChange(maxTeams);
    }
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 3,
        backgroundColor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}
    >
      <Typography 
        variant="h6" 
        component="label" 
        sx={{ 
          mb: 2, 
          display: 'block',
          fontWeight: 600,
          color: 'text.primary'
        }}
      >
        Number of Teams
      </Typography>
      
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          justifyContent: 'center'
        }}
      >
        <IconButton
          onClick={handleDecrease}
          disabled={teamCount <= minTeams}
          size="large"
          sx={{
            backgroundColor: 'action.hover',
            '&:hover': {
              backgroundColor: 'action.selected'
            },
            '&.Mui-disabled': {
              backgroundColor: 'action.disabledBackground'
            }
          }}
        >
          <RemoveIcon />
        </IconButton>

        <TextField
          value={teamCount}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          type="number"
          inputProps={{
            min: minTeams,
            max: maxTeams,
            style: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 600 }
          }}
          sx={{
            width: 80,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& input': {
                padding: '12px 8px'
              }
            }
          }}
        />

        <IconButton
          onClick={handleIncrease}
          disabled={teamCount >= maxTeams}
          size="large"
          sx={{
            backgroundColor: 'action.hover',
            '&:hover': {
              backgroundColor: 'action.selected'
            },
            '&.Mui-disabled': {
              backgroundColor: 'action.disabledBackground'
            }
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          mt: 2, 
          display: 'block', 
          textAlign: 'center' 
        }}
      >
        {participantCount > 0 
          ? `${participantCount} participants → ${teamCount} teams`
          : 'Add participants to enable team generation'
        }
      </Typography>
    </Paper>
  );
} 