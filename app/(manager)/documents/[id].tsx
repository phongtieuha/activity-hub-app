import { Divider } from "@/components/ui/divider";
import { HStack } from "@/components/ui/hstack";
import { DownloadIcon, Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import React from "react";
import { Pressable, ScrollView } from "react-native";

type TDocument = {
  id: string;
  title: string;
};

const DocumentRecords: TDocument[] = [
  {
    id: "1",
    title: "Document_1.pdf",
  },
  {
    id: "2",
    title: "Document_2.pdf",
  },
  {
    id: "3",
    title: "Document_3.pdf",
  },
  // Add 20 more mock records
  ...Array.from({ length: 20 }).map((_, i) => ({
    id: `${i + 4}`,
    title: `Document_${i + 4}.pdf`,
  })),
];

const Documents = () => {
  return (
    <ScrollView>
      {DocumentRecords.map((item) => (
        <Pressable key={item.id}>
          <HStack className="gap-5 items-center px-4 pt-4">
            <Icon as={DownloadIcon} />
            <Text className="font-bold text-typography-900">{item.title}</Text>
          </HStack>
          <Divider className="mt-4" />
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default Documents;
