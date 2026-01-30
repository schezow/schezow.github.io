"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import NextLink from "next/link";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Copyright from "@/components/Copyright";
import LogoutIcon from "@mui/icons-material/Logout";
import { getItemState } from "@/contexts/ItemStateContext";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: (theme.vars ?? theme).palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));

export default function Pouch() {
  const [buttonStates, setButtonStates] = React.useState<boolean[]>(
    Array(16).fill(false),
  );
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<
    "success" | "error"
  >("success");

  const TeamUserIdLists = [
    7106088,
    7573868,
    7549321,
    6421206,

    6801118,
    7449068,
    7492324,
    0,

    6516013,
    6634683,
    7011681,
    0,

    7400296,
    6300441,
    0,
    0,
  ];

  const TeamLists = [
    "비즈니스지원전략팀",
    "ESC",
    "보안기획운영팀",
    "GBC사업관리팀",

    "워크인프라팀",
    "자산전략팀",
    "보안진단개선팀",
    "GBC개발팀", //No use

    "라이프디자인팀",
    "자산개발팀",
    "개인정보보호팀",
    "사무용품", //No use

    "행사기획팀",
    "글로벌자산지원팀",
    "발신함", //No use
    "사무용품", //No use
  ];

  const toggleButton = async (index: number) => {
    const newState = !buttonStates[index];

    // 상태 업데이트
    setButtonStates((prev) => {
      const newStates = [...prev];
      newStates[index] = newState;
      return newStates;
    });

    // API 호출하여 상태 저장
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: TeamUserIdLists.at(index),
          pouch_state: newState,
          // robot_use: false,
          // current_state: "idle",
        }),
      });

      if (response.ok) {
        setSnackbarMessage(`행낭 ${index + 1}번 상태가 변경되었습니다.`);
        setSnackbarSeverity("success");
      } else {
        setSnackbarMessage("상태 저장 중 오류가 발생했습니다.");
        setSnackbarSeverity("error");
        // 실패 시 상태 롤백
        setButtonStates((prev) => {
          const newStates = [...prev];
          newStates[index] = !newState;
          return newStates;
        });
      }

      // console.log(`http://223.171.137.10:8000/pouch/${index + 1}`);

      const response_bridge = await fetch(
        // `http://223.171.137.10:8000/pouch/${TeamUserIdLists.at(index)}`,
        `http://223.171.137.10:8000/pouch/${TeamUserIdLists.at(index)}`,
        {
          method: "POST",
        },
      );
    } catch (error) {
      setSnackbarMessage("서버와의 통신 중 오류가 발생했습니다.");
      setSnackbarSeverity("error");
      // 실패 시 상태 롤백
      setButtonStates((prev) => {
        const newStates = [...prev];
        newStates[index] = !newState;
        return newStates;
      });
    }
    setOpenSnackbar(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // 컴포넌트 마운트 시 저장된 상태 불러오기
  useEffect(() => {
    const loadStates = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const newStates = Array(16).fill(false);
            Object.entries(result.data).forEach(
              ([id, state]: [string, any]) => {
                const index = TeamUserIdLists.indexOf(parseInt(id));
                if (
                  index >= 0 &&
                  index < 16 &&
                  state.pouch_state !== undefined
                ) {
                  newStates[index] = state.pouch_state;
                }
              },
            );
            setButtonStates(newStates);
          }
        }
      } catch (error) {
        console.error("Failed to load states:", error);
      }
    };
    loadStates();

    // 1초마다 실행
    const intervalId = setInterval(loadStates, 1000);

    // cleanup 함수: 컴포넌트 언마운트 시 인터벌 정리
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          my: 4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" component="h1" sx={{ mb: 2 }}>
          행낭
        </Typography>

        <Box sx={{ flexGrow: 1 }}>
          <Grid
            container
            spacing={{ xs: 2, md: 2 }}
            columns={{ xs: 8, sm: 8, md: 8 }}
          >
            {Array.from(Array(16)).map((_, index) => (
              <Grid key={index} size={{ xs: 2, sm: 2, md: 2 }}>
                {/* <Item>{index + 1}</Item> */}
                <Button
                  variant={buttonStates[index] ? "contained" : "outlined"}
                  fullWidth
                  onClick={() => toggleButton(index)}
                  sx={{ fontSize: "0.55rem" }}
                  disabled={
                    index === 7 || index === 11 || index === 14 || index === 15
                  }
                >
                  {TeamLists.at(index)}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ maxWidth: "sm", my: 4, display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            component={NextLink}
            href="/"
            color="error"
            startIcon={<LogoutIcon />}
          >
            Exit
          </Button>
        </Box>
        {/* <ProTip /> */}
        <Copyright />
      </Box>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
