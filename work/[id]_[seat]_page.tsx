"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import NextLink from "next/link";
import Copyright from "@/components/Copyright";
import Image from "next/image";
import styles from "../../styles.module.css";
import Grid from "@mui/material/Grid";
import LogoutIcon from "@mui/icons-material/Logout";
import InputIcon from "@mui/icons-material/Input";
import OutputIcon from "@mui/icons-material/Output";
import MailIcon from "@mui/icons-material/Mail";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import InventoryIcon from "@mui/icons-material/Inventory";
import DesignServicesIcon from "@mui/icons-material/DesignServices";
import IdIcon from "@mui/icons-material/AccountCircle";
import SeatIcon from "@mui/icons-material/EventSeat";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import SmartToyIcon from "@mui/icons-material/SmartToy";

export default function Order() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const seat = params.seat as string;
  const [loginState, setLoginState] = useState<boolean | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success",
  );
  const [waitState, setWaitState] = useState(false);
  const [pouchState, setPouchState] = useState(false);
  const [robotState, setRobotState] = useState<
    | "None"
    | "Delay"
    | "Cancel"
    | "Start"
    | "Wait"
    | "Success"
    | "Return"
    | "Error"
    | "Nop"
    | "Charge"
  >("None");
  const [taskId, setTaskId] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [requestTime, setRequestTime] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const [currentButton, setCurrentButton] = useState<string | null>("완료");
  const [delayMessage, setDelayMessage] = useState<string | null>(null);
  const [delayButton, setDelayButton] = useState<string | null>("완료");
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginState = async () => {
      try {
        const response = await fetch(`/api/user?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.login_state === true) {
            setLoginState(true);
          } else {
            setLoginState(false);
            router.push("/"); // 로그인 상태가 false이면 메인 페이지로 리다이렉트
          }
        } else {
          setLoginState(false);
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to check login state:", error);
        setLoginState(false);
        router.push("/");
      }
    };

    if (id) {
      checkLoginState();
    }
  }, [id, router]);

  // 로봇 상태 모니터링
  useEffect(() => {
    const checkPopUp = async () => {
      try {
        const response_bridge = await fetch(
          `http://223.171.137.10:8000/pop-up/${id}`,
        );
        if (response_bridge.ok) {
          const result = await response_bridge.json();

          if (result) {
            const status = result.data["type"];

            if (result.display) {
              if (status === "start") {
                setRobotState("Start");
                setShowModal(false);
                setRequestTime(null);
                setWaitState(false);
              } else if (status === "wait" && !waitState) {
                setRobotState("Wait");
                const time = new Date(
                  Date.now() + Number(result.data["timeout"]) * 60 * 1000,
                ).toISOString();

                // state.json에 request_time 저장
                try {
                  await fetch("/api/user", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: id,
                      request_time: time,
                    }),
                  });

                  setWaitState(true);
                  setRequestTime(time);
                } catch (error) {
                  console.error("Failed to save request_time:", error);
                }
              } else if (status === "delay") {
                setRobotState("Delay");
                const time = new Date(
                  Date.now() + Number(result.data["remain_time"]) * 60 * 1000,
                ).toISOString();

                // state.json에 request_time 저장
                try {
                  await fetch("/api/user", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: id,
                      request_time: time,
                    }),
                  });

                  setDelayMessage(
                    `예상 대기 시간\n 약 ${result.data["remain_time"]}분 입니다. 취소를 원하시면 호출 취소 버튼을 눌러주세요. 로봇이 출발하면 취소가 불가합니다.`,
                  );
                  setDelayButton("호출 취소");
                  setWaitState(true);
                  setRequestTime(time);
                } catch (error) {
                  console.error("Failed to save request_time:", error);
                }
              } else if (status === "cancel") {
                setRobotState("Cancel");
              } else if (status === "return") {
                setRobotState("Return");
              } else if (status === "success") {
                setRobotState("Success");
              } else if (status === "error") {
                setRobotState("Error");
              } else if (status === "nop") {
                setRobotState("Nop");
              } else if (status === "charge") {
                setRobotState("Charge");
              }
            } else {
              setRobotState("None");
              setWaitState(false);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch robot status:", error);
      }
    };

    if (loginState === true) {
      const intervalId = setInterval(checkPopUp, 1000);
      return () => clearInterval(intervalId);
    }
  }, [loginState, requestTime, waitState]);

  // robotState 변화 감지
  useEffect(() => {
    // robotState가 변경될 때마다 실행할 로직을 여기에 추가
    // console.log("Robot State changed to:", robotState);
    setWaitState(false);
  }, [robotState]);

  async function savePouchState(state: boolean) {
    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          pouch_state: state,
        }),
      });

      if (response.ok) {
        if (state) {
          setSnackbarMessage(`전달할 행낭이 있습니다.`);
          setSnackbarSeverity("success");
        } else {
          setSnackbarMessage(`전달할 행낭이 없습니다.`);
          setSnackbarSeverity("success");
        }
      } else {
        setSnackbarMessage("상태 저장 중 오류가 발생했습니다.");
        setSnackbarSeverity("error");
        // 실패 시 상태 롤백
        setPouchState(true);
      }
    } catch (error) {
      setSnackbarMessage("서버와의 통신 중 오류가 발생했습니다.");
      setSnackbarSeverity("error");
      // 실패 시 상태 롤백
      setPouchState(true);
    }
    setOpenSnackbar(true);
  }

  useEffect(() => {
    savePouchState(pouchState);
  }, [pouchState]);

  // 모달 자동 닫기 로직
  useEffect(() => {
    if (showModal && requestTime) {
      const checkTime = () => {
        const now = new Date();
        const requestTimeDate = new Date(requestTime);

        if (now >= requestTimeDate) {
          setShowModal(false);
          setRequestTime(null);

          handleTimeout();
        }
      };

      const timeCheckInterval = setInterval(checkTime, 1000);
      return () => clearInterval(timeCheckInterval);
    }
  }, [showModal, requestTime]);

  // 페이지 로드 시 seat 값 저장 및 상태 확인 및 1초마다 업데이트
  useEffect(() => {
    // // 로봇 상태 확인
    // const checkPopUp = async () => {
    //   try {
    //     const response = await fetch("/api/robot");
    //     if (response.ok) {
    //       const result = await response.json();
    //       if (result.success && result.data) {
    //         // idle 상태인 로봇이 1개 이상 있는지 확인
    //         const idleRobots = Object.values(result.data).filter(
    //           (robot: any) => robot.officeBox_state === "idle"
    //         );
    //         setRobotsAvailable(idleRobots.length > 0);
    //       }
    //     }
    //   } catch (error) {
    //     console.error("Failed to fetch robot status:", error);
    //   }
    // };

    // 페이지 로드 시 seat 값 저장
    const saveSeatData = async () => {
      try {
        const response = await fetch("/api/user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: id,
            seat: seat,
          }),
        });
        if (!response.ok) {
          console.error("Failed to save seat data");
        }
      } catch (error) {
        console.error("Failed to save seat data:", error);
      }
    };

    const checkUserState = async () => {
      try {
        const response = await fetch(`/api/user?id=${id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setPouchState(data.data.pouch_state);
          }
        }
      } catch (error) {
        console.error("Failed to fetch pouch state:", error);
      }
    };

    if (id && seat && loginState === true) {
      // 페이지 로드 시 seat 값 저장
      saveSeatData();

      // 처음 한 번 즉시 실행
      // checkPopUp();
      checkUserState();

      // 1초마다 실행
      const intervalId = setInterval(checkUserState, 1000);
      // const robotIntervalId = setInterval(checkPopUp, 1000);

      // cleanup 함수: 컴포넌트 언마운트 시 인터벌 정리
      return () => {
        clearInterval(intervalId);
        // clearInterval(robotIntervalId);
      };
    }
  }, [id, seat, loginState]);

  const showConfirmDialog = (action: string) => {
    setPendingAction(action);
    setConfirmDialog(true);
  };

  const handleConfirmYes = () => {
    setConfirmDialog(false);
    if (pendingAction) {
      if (pendingAction === "exit") {
        handleExitClick();
      } else {
        handleButtonClick(pendingAction);
      }
      setPendingAction(null);
    }
  };

  const handleConfirmNo = () => {
    setConfirmDialog(false);
    setPendingAction(null);
  };

  const handleButtonClick = async (action: string) => {
    try {
      let item = "";
      let ros_action = "";
      let text = "";

      if (action === "office_box_call") {
        item = "office";
        ros_action = "delivery";
        text = "오피스 박스 호출";
        setCurrentMessage(
          "오피스 박스를 가져왔습니다.\n수령 후 수령완료 버튼을 눌러주세요.\n3분 이내에 버튼을 누르지 않으면\n로봇이 되돌아갑니다.",
        );
        setCurrentButton("수령 완료");
      } else if (action === "office_box_return") {
        item = "office";
        ros_action = "return";
        text = "오피스 박스 반납";
        setCurrentMessage(
          "오피스 박스를 올려주세요.\n반납 후 반납완료 버튼을 눌러주세요.\n3분 이내에 버튼을 누르지 않으면\n로봇이 되돌아갑니다.",
        );
        setCurrentButton("반납 완료");
      } else if (action === "consumable_supplies") {
        item = "consumable_supplies";
        ros_action = "delivery";
        text = "소모품 호출";
        setCurrentMessage(
          "소모품을 가져왔습니다.\n수령 후 수령완료 버튼을 눌러주세요.\n10분 이내에 버튼을 누르지 않으면\n로봇이 되돌아갑니다.",
        );
        setCurrentButton("수령 완료");
      } else if (action === "shared_supplies") {
        item = "shared_supplies";
        ros_action = "delivery";
        text = "공용품 호출";
        setCurrentMessage(
          "공용품을 가져왔습니다.\n사용 후 사용완료 버튼을 눌러주세요.\n10분 이내에 버튼을 누르지 않으면\n로봇이 되돌아갑니다.",
        );
        setCurrentButton("사용 완료");
      } else if (action === "pouch_call") {
        item = "pouch";
        ros_action = "delivery";
        text = "행낭";
        setCurrentMessage(
          "행낭을 가져왔습니다.\n수령 후 수령완료 버튼을 눌러주세요.\n3분 이내에 버튼을 누르지 않으면\n로봇이 되돌아갑니다.",
        );
        setCurrentButton("수령 완료");
      }

      const response = await fetch("/api/user/robot/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          seat: seat,
          item: item,
          action: ros_action,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data["task_id"] == 0) {
          if (item === "consumable_supplies") {
            setSnackbarMessage("남아있는 사무용품(소모품)이 없습니다.");
            setSnackbarSeverity("error");
          } else if (item === "shared_supplies") {
            setSnackbarMessage("남아있는 사무용품(공용품)이 없습니다.");
            setSnackbarSeverity("error");
          } else {
            setSnackbarMessage(
              "서비스 이용이 불가합니다.\n가용한 로봇이 없습니다.",
            );
            setSnackbarSeverity("error");
          }
        } else {
          setTaskId(Number(data["task_id"]));
          setSnackbarMessage(`${text}이 요청 되었습니다.`);
          setSnackbarSeverity("success");
        }
      } else {
        setSnackbarMessage(`${text} 처리 중 오류가 발생했습니다.`);
        setSnackbarSeverity("error");
      }
    } catch (error) {
      setSnackbarMessage("서버와의 통신 중 오류가 발생했습니다.");
      setSnackbarSeverity("error");
    }
    setOpenSnackbar(true);
  };

  const handleExitClick = async () => {
    try {
      await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          login_state: false,
        }),
      });
      // API 호출 후 페이지 이동
      router.push("/");
    } catch (error) {
      console.error("Error:", error);
      // 에러가 발생해도 페이지 이동
      router.push("/");
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleTimeout = async () => {
    try {
      const response = await fetch(`http://223.171.137.10:3000/api/user/ok`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: id,
          action: "timeout",
        }),
      });
      const data = await response.json();
      setShowModal(false);
      setRequestTime(null);
      setWaitState(false);
    } catch (error) {}
  };

  // 로그인 상태 확인 중이거나 로그인되지 않은 경우 로딩화면 표시
  if (loginState === null) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            my: 20,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (loginState === false) {
    return null; // 리다이렉트 중이므로 아무것도 렌더링하지 않음
  }

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
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "center",
            marginBottom: 2,
          }}
        >
          <IdIcon color="action" fontSize="large" />
          {id}
          <SeatIcon color="info" fontSize="large" sx={{ marginLeft: 1 }} />
          {seat}
        </Box>

        <Box sx={{ flexDirection: "row" }}>
          <Image
            src="/images/delivery.png"
            alt="Delivery Robot"
            className={styles.animatedImage}
            width={0}
            height={0}
            sizes="50vw"
          />
          <Image
            src="/images/arrow-right.png"
            alt="Moving"
            className={styles.blinkingRightArrow}
            width={0}
            height={0}
            sizes="50vw"
          />
          <Image
            src={"/images/flag.png"}
            alt="Delivery Goal"
            className={styles.image_flag}
            width={0}
            height={0}
            sizes="50vw"
          />
        </Box>

        <Grid container spacing={3} sx={{ marginTop: 4, marginBottom: 3 }}>
          <Grid size={12}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                justifyContent: "center",
              }}
            >
              <InventoryIcon />
              <Typography>오피스 박스</Typography>
            </Box>
          </Grid>
          <Grid size="grow" />
          <Grid size={5}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<InputIcon />}
              onClick={() => showConfirmDialog("office_box_call")}
              // disabled={waitState}
              disabled={waitState}
            >
              호출
            </Button>
          </Grid>
          <Grid size={5}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              endIcon={<OutputIcon />}
              onClick={() => showConfirmDialog("office_box_return")}
              // disabled={waitState}
              disabled={waitState}
            >
              반납
            </Button>
          </Grid>
          <Grid size="grow" />
          <Grid size={12}>
            <Divider variant="middle" />
          </Grid>
          <Grid size={12}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                justifyContent: "center",
              }}
            >
              <DesignServicesIcon />
              <Typography>사무용품</Typography>
            </Box>
          </Grid>
          <Grid size="grow" />
          <Grid size={5}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<InboxIcon />}
              onClick={() => showConfirmDialog("consumable_supplies")}
              disabled={waitState}
            >
              소모품
            </Button>
          </Grid>
          <Grid size={5}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<InboxIcon />}
              onClick={() => showConfirmDialog("shared_supplies")}
              disabled={waitState}
            >
              공용품
            </Button>
          </Grid>
          <Grid size="grow" />
          <Grid size={12}>
            <Divider variant="middle" />
          </Grid>
          <Grid size={12} sx={{ textAlign: "center" }}>
            행낭
          </Grid>
          <Grid size={2} />
          <Grid size={8}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<MailIcon />}
              onClick={() => showConfirmDialog("pouch_call")}
              disabled={!pouchState || waitState}
            >
              전달
            </Button>
          </Grid>
          <Grid size={2} />
          <Grid size={12}>
            <Divider variant="middle" />
          </Grid>
        </Grid>

        <Box sx={{ maxWidth: "sm" }}>
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => showConfirmDialog("exit")}
          >
            Exit
          </Button>
        </Box>
        {/* <ProTip /> */}
        <br />
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

      {/* Wait 모달 */}
      <Dialog
        open={robotState === "Wait"}
        onClose={() => {
          setShowModal(false);
          setRequestTime(null);
          setWaitState(false);
        }}
        maxWidth="sm"
        fullWidth
        hidden={robotState !== "Wait"}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "left",
          }}
        >
          <SmartToyIcon sx={{ color: "primary.main" }} />
          로봇 도착
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Image
              src="/images/delivery.png"
              alt="Delivery Robot"
              className={styles.image_delivery}
              width={0}
              height={0}
              sizes="50vw"
            />
            <Typography variant="h6" gutterBottom>
              로봇이 기다리고 있습니다.
            </Typography>
            <Typography color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
              {currentMessage}
            </Typography>
            {requestTime && (
              <Typography
                variant="caption"
                sx={{ mt: 2, display: "block", color: "warning.main" }}
              >
                자동 닫힘 시간: {new Date(requestTime).toLocaleTimeString()}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ mt: -2, mb: 2, justifyContent: "center" }}>
          <Button
            onClick={async () => {
              try {
                const response = await fetch(
                  `http://223.171.137.10:3000/api/user/ok`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: id,
                      action: "click",
                    }),
                  },
                );
                const data = await response.json();
                setShowModal(false);
                setRequestTime(null);
                setWaitState(false);
              } catch (error) {}
            }}
            color="primary"
            variant="outlined"
          >
            {currentButton}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delay 모달 */}
      <Dialog
        open={robotState === "Delay"}
        onClose={() => {
          setShowModal(false);
          setRequestTime(null);
          setWaitState(false);
        }}
        maxWidth="sm"
        fullWidth
        hidden={robotState !== "Delay"}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "left",
          }}
        >
          <SmartToyIcon sx={{ color: "primary.main" }} />
          로봇 기다리는 중...
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Image
              src="/images/delivery.png"
              alt="Delivery Robot"
              className={styles.image_delivery}
              width={0}
              height={0}
              sizes="50vw"
            />
            <Typography variant="h6" gutterBottom>
              {delayMessage}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ mt: -2, mb: 2, justifyContent: "center" }}>
          <Button
            onClick={async () => {
              try {
                const response = await fetch(
                  `http://223.171.137.10:3000/api/user/cancel`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      id: id,
                      task_id: taskId,
                    }),
                  },
                );
                const data = await response.json();
                setShowModal(false);
                setRequestTime(null);
                setWaitState(false);
              } catch (error) {}
            }}
            color="primary"
            variant="outlined"
          >
            {delayButton}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Wait 이외의 모달 */}
      <Dialog
        open={
          robotState === "Start" ||
          robotState === "Success" ||
          robotState === "Return" ||
          robotState === "Error" ||
          robotState === "Cancel" ||
          robotState === "Nop" ||
          robotState === "Charge"
        }
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "left",
          }}
        >
          <SmartToyIcon sx={{ color: "primary.main" }} />
          Info
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Image
              src="/images/delivery.png"
              alt="Delivery Robot"
              className={styles.image_delivery}
              width={0}
              height={0}
              sizes="50vw"
            />
            <Typography
              variant="h6"
              gutterBottom
              sx={{ whiteSpace: "pre-line" }}
            >
              {robotState === "Start"
                ? "로봇이 출발하였습니다."
                : robotState === "Success"
                ? "종료되었습니다."
                : robotState === "Return"
                ? "캐비넷으로 복귀합니다."
                : robotState === "Error"
                ? "Error\n운영자가 호출되었습니다."
                : robotState === "Delay"
                ? "로봇이 대기중입니다."
                : robotState === "Cancel"
                ? "취소되었습니다."
                : robotState === "Nop"
                ? "운영시간이 아닙니다."
                : robotState === "Charge"
                ? "모든 로봇이 충전 중입니다."
                : ""}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* 확인 다이얼로그 */}
      <Dialog
        open={confirmDialog}
        onClose={handleConfirmNo}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "center",
          }}
        >
          <SmartToyIcon sx={{ color: "primary.main" }} />
          확인
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography variant="body1">계속 진행하시겠습니까?</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 2, pb: 3 }}>
          <Button
            onClick={handleConfirmYes}
            variant="contained"
            color="primary"
          >
            예
          </Button>
          <Button onClick={handleConfirmNo} variant="outlined" color="primary">
            아니오
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
