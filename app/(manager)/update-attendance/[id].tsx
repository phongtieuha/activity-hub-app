import {
  ActivityParticipantListItemDtoAttendanceStatus,
  ActivityParticipantSummaryDto,
  editAttendance,
  EditAttendanceRequestDto,
  EditAttendanceRequestDtoNewStatus,
  list2,
  summary,
} from "@/__generated-client/http-client-integration";
import { useGlobalLoading } from "@/components/GlobalLoading";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import AnimatedCard, { cardFadeDelay } from "@/components/ui/AnimatedCard";
import { Badge, BadgeIcon, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
} from "@/components/ui/checkbox";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import {
  CheckIcon,
  ChevronLeftIcon,
  CircleIcon,
  DownloadIcon,
  Icon,
  SearchIcon,
} from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Pressable } from "@/components/ui/pressable";
import {
  Radio,
  RadioGroup,
  RadioIcon,
  RadioIndicator,
} from "@/components/ui/radio";
import { Text } from "@/components/ui/text";
import { Toast, ToastTitle, useToast } from "@/components/ui/toast";
import { VStack } from "@/components/ui/vstack";
import {
  AttendanceStatus,
  AttendanceStatusToIconMapping,
  AttendanceStatusValues,
  TUpdateAttendanceRecord,
} from "@/models/update-attendance";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  View,
} from "react-native";

function isAttendanceRecordMarkable(status: TUpdateAttendanceRecord) {
  return status.attendanceStatus !== AttendanceStatus.PRESENT;
}

const UpdateAttendance = () => {
  // 1) Navigation & global utilities
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const toast = useToast();
  const loading = useGlobalLoading();

  // 2) State
  const [attendanceSummary, setAttendanceSummary] =
    React.useState<ActivityParticipantSummaryDto>();
  const [filterParticipantName, setFilterParticipantName] = React.useState("");
  const [showAttendanceSheet, setShowAttendanceSheet] = React.useState(false);
  const [isSelectAll, setIsSelectAll] = React.useState(false);
  const [attendantRecords, setAttendantRecords] = React.useState<
    TUpdateAttendanceRecord[]
  >([]);
  const [selectedAttendanceStatusRadio, setSelectedAttendanceStatusRadio] =
    React.useState<AttendanceStatus>();
  const [selectedAttendanceStatusTab, setSelectedAttendanceStatusTab] =
    React.useState<AttendanceStatus>(AttendanceStatus.UNMARKED);
  const [refreshing, setRefreshing] = React.useState(false);

  // 3) Derived state
  const filteredAttendanceRecords = React.useMemo(
    () =>
      attendantRecords
        .filter(
          (record) => record.attendanceStatus === selectedAttendanceStatusTab
        )
        .filter((record) =>
          !!filterParticipantName.trim().length
            ? record.name
                .toLowerCase()
                .includes(filterParticipantName.toLowerCase())
            : true
        ),
    [attendantRecords, selectedAttendanceStatusTab, filterParticipantName]
  );

  // 4) Handlers
  const handleSelectAttendanceStatusTab = (status: AttendanceStatus) => {
    setSelectedAttendanceStatusTab(status);
    clearTUpdateAttendanceRecords();
  };

  const handleSelectAll = () => {
    setIsSelectAll((prev) => {
      const next = !prev;
      setAttendantRecords((prevRecords) =>
        prevRecords.map((record) => ({ ...record, isChecked: next }))
      );
      return next;
    });
  };

  const handleSelectAttendance = (record: TUpdateAttendanceRecord) => {
    setIsSelectAll(false);
    setAttendantRecords((prevRecords) =>
      prevRecords.map((r) =>
        r.id === record.id ? { ...r, isChecked: !r.isChecked } : r
      )
    );
  };

  const handleShowUpdateAttendance = () => {
    setShowAttendanceSheet(true);
  };

  const handlepCloseUpdateAttendance = () => {
    setShowAttendanceSheet(false);
    setSelectedAttendanceStatusRadio(undefined);
  };

  const handleSelectStatus = (e: AttendanceStatus) => {
    setSelectedAttendanceStatusRadio(e);
  };

  const handleUpdateAttendance = async () => {
    let payloadAttendanceStatus: EditAttendanceRequestDtoNewStatus;
    switch (selectedAttendanceStatusRadio) {
      case AttendanceStatus.PRESENT:
        payloadAttendanceStatus = EditAttendanceRequestDtoNewStatus.PRESENT;
        break;
      case AttendanceStatus.ABSENT:
        payloadAttendanceStatus = EditAttendanceRequestDtoNewStatus.ABSENT;
        break;
      case AttendanceStatus.EXCUSED:
        payloadAttendanceStatus = EditAttendanceRequestDtoNewStatus.EXCUSED;
        break;
      case AttendanceStatus.FALL_OUT:
        payloadAttendanceStatus = EditAttendanceRequestDtoNewStatus.FALLOUT;
        break;
      case AttendanceStatus.UNMARKED:
        payloadAttendanceStatus = EditAttendanceRequestDtoNewStatus.UNMARKED;
        break;
    }
    const payload: EditAttendanceRequestDto = {
      activityId: id as string,
      userIds: filteredAttendanceRecords
        .filter((item) => item.isChecked)
        .map((item) => item.id),
      newStatus: payloadAttendanceStatus!,
    };
    await editAttendance(payload);
    const summaryResp = await summary(id as string);
    setAttendanceSummary(summaryResp?.data);

    filteredAttendanceRecords
      .filter((item) => item.isChecked)
      .forEach((record) => {
        if (isAttendanceRecordMarkable(record)) {
          record.attendanceStatus = selectedAttendanceStatusRadio!;
        }
      });
    setAttendantRecords([...attendantRecords]);

    const newId = Math.random();

    toast.show({
      id: newId.toString(),
      placement: "top",
      duration: 3000,
      render: ({ id }) => {
        const uniqueToastId = "toast-" + id;
        return (
          <Toast nativeID={uniqueToastId} action="success" variant="solid">
            <ToastTitle>Participant updated successfully</ToastTitle>
          </Toast>
        );
      },
    });

    setSelectedAttendanceStatusRadio(undefined);

    clearTUpdateAttendanceRecords();

    handlepCloseUpdateAttendance();
  };

  const clearTUpdateAttendanceRecords = () => {
    setAttendantRecords((prevRecords) =>
      prevRecords.map((record) => ({ ...record, isChecked: false }))
    );
    setIsSelectAll(false);
  };

  // 5) Data loading
  const fetchData = React.useCallback(async () => {
    loading.show("Loading attendance...");
    try {
      const summaryResp = await summary(id as string);
      setAttendanceSummary(summaryResp?.data);

      const participantsResp = await list2(id as string, {
        pageNumber: 1,
        pageSize: 1000,
      });
      const attendanceRecords: TUpdateAttendanceRecord[] =
        participantsResp?.data?.map((participant) => {
          let attendanceStatus = null;
          switch (participant.attendanceStatus) {
            case ActivityParticipantListItemDtoAttendanceStatus.ABSENT:
              attendanceStatus = AttendanceStatus.ABSENT;
              break;
            case ActivityParticipantListItemDtoAttendanceStatus.PRESENT:
              attendanceStatus = AttendanceStatus.PRESENT;
              break;
            case ActivityParticipantListItemDtoAttendanceStatus.EXCUSED:
              attendanceStatus = AttendanceStatus.EXCUSED;
              break;
            case ActivityParticipantListItemDtoAttendanceStatus.FALLOUT:
              attendanceStatus = AttendanceStatus.FALL_OUT;
              break;
            case ActivityParticipantListItemDtoAttendanceStatus.UNMARKED:
            default:
              attendanceStatus = AttendanceStatus.UNMARKED;
              break;
          }
          const obj = {
            id: participant.userId!,
            name: participant.name!,
            nric: participant.nric!,
            attendanceStatus,
            isChecked: false,
          };
          return obj;
        }) || [];
      setAttendantRecords(attendanceRecords);
    } finally {
      loading.hide();
    }
  }, [id, loading]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 6) Refresh handler
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  return (
    <>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#e11d48"
            colors={["#e11d48", "#fff"]}
            progressBackgroundColor="#222"
          />
        }
      >
        <SafeAreaView className="bg-gray-900">
          <VStack space="4xl">
            <HStack className="justify-between px-4">
              <Pressable className="" onPress={() => router.back()}>
                <Icon as={ChevronLeftIcon} className="!size-8 text-white" />
              </Pressable>
              <Heading className="text-white">UPDATE ATTENDANCE</Heading>
              <Pressable className="">
                <Icon as={DownloadIcon} className="!size-8 text-white" />
              </Pressable>
            </HStack>

            <HStack space="lg" className="px-4">
              <VStack className="items-center justify-center bg-gray-800 rounded-xl px-6 py-3 flex-1">
                <Heading size="2xl" className="text-white">
                  {attendanceSummary?.totalParticipants}
                </Heading>
                <Text className="text-white">TOTAL</Text>
              </VStack>

              <VStack space="lg">
                <VStack className="items-center bg-gray-800 rounded-xl px-6 py-3">
                  <Text size="2xl" className="font-semibold text-green-600">
                    {attendanceSummary?.attendanceCounts?.["PRESENT"] ?? 0}
                  </Text>
                  <Text className="text-white">PRESENT</Text>
                </VStack>
                <VStack className="items-center bg-gray-800 rounded-xl px-6 py-3">
                  <Text size="2xl" className="font-semibold text-white">
                    {attendanceSummary?.attendanceCounts?.["ABSENT"] ?? 0}
                  </Text>
                  <Text className="text-white">ABSENT</Text>
                </VStack>
              </VStack>
              <VStack space="lg">
                <VStack className="items-center bg-gray-800 rounded-xl px-6 py-3">
                  <Text size="2xl" className="font-semibold text-white">
                    {attendanceSummary?.attendanceCounts?.["FALLOUT"] ?? 0}
                  </Text>
                  <Text className="text-white">FALL OUT</Text>
                </VStack>
                <VStack className="items-center bg-gray-800 rounded-xl px-6 py-3">
                  <Text size="2xl" className="font-semibold text-white">
                    {attendanceSummary?.attendanceCounts?.["EXCUSED"] ?? 0}
                  </Text>
                  <Text className="text-white">EXCUSED</Text>
                </VStack>
              </VStack>
            </HStack>
          </VStack>
          <Divider className="my-4 bg-transparent" />
        </SafeAreaView>
        <View
          style={
            {
              // add height or padding as needed
            }
          }
          className="bg-white flex-1"
        >
          <VStack space="md" className="">
            <Divider className="mb-1" />
            <AnimatedCard delay={cardFadeDelay}>
              <Input className="rounded-none border-0 px-4">
                <InputSlot className="">
                  <InputIcon as={SearchIcon} />
                </InputSlot>
                <InputField
                  placeholder="Search participant's name"
                  value={filterParticipantName}
                  onChangeText={setFilterParticipantName}
                />
              </Input>
            </AnimatedCard>
            {/* <Divider className="mb-3" /> */}
            <AnimatedCard delay={cardFadeDelay * 2}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <HStack className="flex-nowrap gap-5 px-4">
                  {AttendanceStatusValues.map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => handleSelectAttendanceStatusTab(value)}
                    >
                      <Badge
                        size="lg"
                        action={
                          value === selectedAttendanceStatusTab
                            ? "error"
                            : "muted"
                        }
                        className="gap-2"
                      >
                        <BadgeIcon
                          as={AttendanceStatusToIconMapping[value]}
                        ></BadgeIcon>
                        <BadgeText>{value}</BadgeText>
                      </Badge>
                    </Pressable>
                  ))}
                </HStack>
              </ScrollView>
            </AnimatedCard>
          </VStack>
          <Divider className="my-3 bg-transparent" />
          <AnimatedCard delay={cardFadeDelay * 3}>
            <Pressable onPress={handleSelectAll}>
              <HStack className="justify-between items-center px-4">
                <Text className="font-bold">
                  PARTICIPANTS ({filteredAttendanceRecords.length})
                </Text>
                {filteredAttendanceRecords.filter(isAttendanceRecordMarkable)
                  .length ? (
                  <Checkbox
                    size="md"
                    value="select-all"
                    isChecked={isSelectAll}
                  >
                    <CheckboxIndicator>
                      <CheckboxIcon as={CheckIcon} />
                    </CheckboxIndicator>
                  </Checkbox>
                ) : undefined}
              </HStack>
            </Pressable>
            <Divider className="my-2 bg-transparent" />
            {filteredAttendanceRecords.map((item) => (
              <Box key={item.id}>
                <Pressable
                  className={`${item.isChecked ? "bg-red-100" : ""}`}
                  onPress={() => handleSelectAttendance(item)}
                >
                  <HStack className="justify-between items-center px-4 pt-4">
                    <VStack>
                      <Text className="font-bold text-typography-900">
                        {item.name}
                      </Text>
                      <Text className="text-typography-400">{item.nric}</Text>
                    </VStack>
                    {isAttendanceRecordMarkable(item) ? (
                      <Checkbox
                        size="md"
                        value={item.id}
                        isChecked={item.isChecked}
                      >
                        <CheckboxIndicator>
                          <CheckboxIcon as={CheckIcon} />
                        </CheckboxIndicator>
                      </Checkbox>
                    ) : (
                      <Badge action="success">
                        <BadgeText>{AttendanceStatus.PRESENT}</BadgeText>
                      </Badge>
                    )}
                  </HStack>
                  <Divider className="mt-4" />
                </Pressable>
              </Box>
            ))}
          </AnimatedCard>
        </View>
      </ScrollView>
      <Box className="sticky bottom-0 left-0 px-4 w-full bg-white/90 pb-8 pt-4">
        <Button
          className={`transition-colors duration-300 backdrop-blur-sm ${
            attendantRecords.some((item) => item.isChecked)
              ? "bg-red-600/90 "
              : "bg-gray-300/90"
          }`}
          size="lg"
          variant="solid"
          action="default"
          onPress={handleShowUpdateAttendance}
          disabled={!attendantRecords.some((item) => item.isChecked)}
        >
          <ButtonText className="text-white">UPDATE</ButtonText>
          <ButtonText className="text-white">ATTENDANCE</ButtonText>
          {filteredAttendanceRecords.filter((item) => item.isChecked).length ? (
            <ButtonText className="text-white">
              (
              {
                filteredAttendanceRecords.filter((item) => item.isChecked)
                  .length
              }
              )
            </ButtonText>
          ) : undefined}
        </Button>
      </Box>
      <KeyboardAvoidingView>
        <Actionsheet
          isOpen={showAttendanceSheet}
          onClose={handlepCloseUpdateAttendance}
        >
          <ActionsheetBackdrop />
          <ActionsheetContent className="">
            <ActionsheetDragIndicatorWrapper>
              <ActionsheetDragIndicator />
            </ActionsheetDragIndicatorWrapper>
            <VStack
              className="w-full py-5 justify-between"
              style={{ height: screenHeight * 0.6 }}
            >
              <Heading size="xl" className="font-bold">
                Attendance
              </Heading>
              <Divider className="my-4 bg-transparent" />

              <VStack space="md">
                <Text size="md" className="font-bold">
                  Select attendance status
                </Text>
                <RadioGroup value={selectedAttendanceStatusRadio}>
                  {AttendanceStatusValues.map((value) => (
                    <Pressable
                      key={value}
                      onPress={() => handleSelectStatus(value)}
                    >
                      <HStack
                        className={`justify-between items-center border p-4 rounded-lg ${
                          value === selectedAttendanceStatusRadio
                            ? "bg-red-50 border-red-600"
                            : "border-gray-300"
                        }`}
                      >
                        <HStack space="md" className="items-center">
                          <Icon as={AttendanceStatusToIconMapping[value]} />
                          <Text className="font-bold text-typography-900">
                            {value}
                          </Text>
                        </HStack>
                        <Radio size="md" value={value}>
                          <RadioIndicator className="">
                            <RadioIcon as={CircleIcon} />
                          </RadioIndicator>
                        </Radio>
                      </HStack>
                    </Pressable>
                  ))}
                </RadioGroup>
              </VStack>

              <Divider className="my-4 bg-transparent" />

              <VStack space="md">
                <Button
                  size="lg"
                  variant="solid"
                  action={
                    selectedAttendanceStatusRadio ? "negative" : "secondary"
                  }
                  onPress={handleUpdateAttendance}
                  isDisabled={!selectedAttendanceStatusRadio}
                >
                  <ButtonText className="text-white">Update</ButtonText>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  action="secondary"
                  onPress={handlepCloseUpdateAttendance}
                >
                  <ButtonText>CANCEL</ButtonText>
                </Button>
              </VStack>
            </VStack>
          </ActionsheetContent>
        </Actionsheet>
      </KeyboardAvoidingView>
    </>
  );
};

export default UpdateAttendance;

const screenHeight = Dimensions.get("window").height;
