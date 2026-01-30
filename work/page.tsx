"use client";

import * as React from "react";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import NextLink from "next/link";
import ProTip from "@/components/ProTip";
import Copyright from "@/components/Copyright";
import Button from "@mui/material/Button";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Image from "next/image";
import styles from "./styles.module.css";
import LoginIcon from "@mui/icons-material/Login";
import KeyIcon from "@mui/icons-material/Key";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const [id, setId] = React.useState(0);
  const [seat, setSeat] = React.useState(0);
  const [password, setPassword] = React.useState("");
  const [idValid, setIdValid] = React.useState(false);
  const [seatValid, setSeatValid] = React.useState(false);
  const [isPassword, setIsPassword] = React.useState(false);
  const [openModal, setOpenModal] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isOperating, setIsOperating] = React.useState(true);
  const [operationTime, setOperationTime] = React.useState({
    start: "",
    end: "",
  });

  const router = useRouter();

  const userSeatLists = [
    29,
    30,
    31,
    32,
    33,
    34,
    78,
    79,
    80,
    81,
    82,
    83,
    84,
    85,
  ];

  // 운영 시간 확인 함수
  const checkOperationTime = () => {
    fetch("http://223.171.137.10:3000/api/open", {
      // fetch("http://223.171.137.10:3000/api/open", {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        const now = new Date();

        // 오늘 날짜로 시작/종료 시간 생성
        const today = new Date();
        const [startHour, startMinute] = data.data.start.split(":").map(Number);
        const [endHour, endMinute] = data.data.end.split(":").map(Number);

        const startTime = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          startHour,
          startMinute,
        );
        const endTime = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          endHour,
          endMinute,
        );

        console.log("현재 시간:", now);
        console.log("운영 시작:", startTime);
        console.log("운영 종료:", endTime);

        setOperationTime({ start: data.data.start, end: data.data.end });
        setIsOperating(now >= startTime && now <= endTime);
      })
      .catch((error) => {
        console.error("Error fetching operation time:", error);
        setIsOperating(false);
      });
  };

  // 컴포넌트 마운트 시 운영 시간 확인
  useEffect(() => {
    checkOperationTime();
    // 1분마다 운영 시간 재확인
    const interval = setInterval(checkOperationTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleIdChange = (event: SelectChangeEvent) => {
    let valid = hasOnlyDigits(String(event.target.value));

    if (valid) {
      setId(Number(event.target.value));
      setIdValid(true);
    } else {
      setIdValid(false);
    }
  };

  function hasOnlyDigits(myString: string): boolean {
    return /^\d+$/.test(myString);
  }

  const handleSeatChange = (event: SelectChangeEvent) => {
    let numInteger: number = Number(event.target.value);
    let find = false;

    for (let i = 0; i < userSeatLists.length; i++) {
      if (userSeatLists[i] === numInteger) find = true;
    }

    if (find) {
      setSeat(numInteger);
      setSeatValid(true);
    } else {
      setSeatValid(false);
    }
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPassword(value);
    if (value) {
      setIsPassword(true);
    } else {
      setIsPassword(false);
    }
  };

  const handleLoginClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 로그인 성공 시 login_state를 true로 설정
        await fetch("/api/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: id,
            login_state: true,
          }),
        });

        router.push(`/${id}/${seat}`);
      } else {
        setOpenModal(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setOpenModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const seatLists = [];
  for (let i = 0; i < userSeatLists.length; i++) {
    seatLists.push(
      <MenuItem value={userSeatLists[i]}>{userSeatLists[i]}</MenuItem>,
    );
  }

  // 운영 시간이 아닐 때 보여줄 페이지
  if (!isOperating) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            my: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "80vh",
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{ mb: 4, textAlign: "center" }}
          >
            🚫 현재 운영시간이 아닙니다
          </Typography>

          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              시작: {operationTime.start}
            </Typography>
            <Typography variant="body1">종료: {operationTime.end}</Typography>
          </Box>

          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ textAlign: "center", mb: 4 }}
          >
            운영 시간에 다시 접속해주세요.
          </Typography>

          <Copyright />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          my: 4,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Robots for Smart Work Infra
        </Typography>

        <Box
          component="form"
          sx={{ "& > :not(style)": { m: 2, width: "15ch" } }}
          noValidate
          autoComplete="off"
        >
          <Image
            src="/images/pick.png"
            alt="Pick Robot"
            className={styles.image_pick}
            width={0}
            height={0}
            sizes="100vw"
          />
          {/* <AnimatedImage
            src="/images/delivery.png"
            alt="Delivery Robot"
            className={styles.image_delivery}
            width={60}
            height={60}
          /> */}
          <Image
            src="/images/delivery.png"
            alt="Delivery Robot"
            className={styles.animatedImage}
            width={0}
            height={0}
            sizes="50vw"
          />
        </Box>

        <Box
          component="form"
          sx={{ "& > :not(style)": { m: 1, width: "13ch" } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            id="demo-simple-select"
            label="ID"
            size="small"
            required
            onChange={(e) =>
              handleIdChange({
                target: { value: e.target.value },
              } as SelectChangeEvent)
            }
            error={!idValid}
            sx={{ width: "50px" }}
          />
        </Box>
        <Box
          component="form"
          sx={{ "& > :not(style)": { m: 1, width: "13ch" } }}
          noValidate
          autoComplete="off"
        >
          <FormControl size="small">
            <InputLabel required id="demo-seat-select-label">
              Seat
            </InputLabel>
            <Select
              labelId="demo-seat-select-label"
              id="demo-simple-seat-select"
              value={seat.toString()}
              label="Seat"
              onChange={handleSeatChange}
              size="small"
              error={!seatValid}
            >
              {seatLists}
            </Select>
          </FormControl>
        </Box>
        <Box
          component="form"
          sx={{ "& > :not(style)": { m: 1, width: "13ch" } }}
          noValidate
          autoComplete="off"
        >
          <TextField
            id="password"
            label="Password"
            type="password"
            required
            size="small"
            onChange={handlePasswordChange}
            error={!isPassword}
            sx={{ width: "50px" }}
          />
        </Box>

        <Button
          variant="contained"
          sx={{ m: 2 }}
          onClick={handleLoginClick}
          disabled={!idValid || !seatValid || !isPassword || loading}
          size="medium"
          startIcon={<LoginIcon />}
        >
          {loading ? "Loading..." : "Login"}
        </Button>

        {/* Password Error Modal */}
        <Dialog open={openModal} onClose={handleCloseModal}>
          <DialogTitle>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <KeyIcon color="primary" />
              인증 실패
            </Box>
          </DialogTitle>
          <DialogContent>
            <Typography>등록 정보가 없습니다. 다시 시도해주세요.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} color="primary">
              확인
            </Button>
          </DialogActions>
        </Dialog>

        {/* <ProTip /> */}
        <br />
        <Copyright />
      </Box>
    </Container>
  );
}
