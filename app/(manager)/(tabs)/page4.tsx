import {
  ActionsheetItem,
  ActionsheetItemText,
  ActionsheetSectionHeaderText,
  ActionsheetSectionList,
} from "@/components/ui/actionsheet";
import { Card } from "@/components/ui/card";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
type SectionItem = {
  title: string;
  onPress: () => void;
};

type Section = {
  title: string;
  data: SectionItem[];
};

export default function TabFourScreen() {
  const router = useRouter();

  const DATA: Section[] = [
    {
      title: "Settings",
      data: [{ title: "Log out", onPress: () => router.replace("/logout") }],
    },
  ];

  return (
    <SafeAreaView className="px-4">
      <Card>
        <ActionsheetSectionList
          sections={DATA}
          keyExtractor={(item, index) => (item as SectionItem).title + index}
          renderItem={({ item }) => {
            const sectionItem = item as SectionItem;
            return (
              <ActionsheetItem onPress={sectionItem.onPress}>
                <ActionsheetItemText className="text-lg">
                  {sectionItem.title}
                </ActionsheetItemText>
              </ActionsheetItem>
            );
          }}
          renderSectionHeader={({ section }) => {
            const sectionObj = section as Section;
            return (
              <ActionsheetSectionHeaderText className="text-lg">
                {sectionObj.title}
              </ActionsheetSectionHeaderText>
            );
          }}
        />
      </Card>
    </SafeAreaView>
  );
}
