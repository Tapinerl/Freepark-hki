import { Text } from "react-native";
import { Card, ui } from "./ui";
export default function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <Text style={ui.heading}>{title}</Text>
      <Text style={ui.subtitle}>{description}</Text>
    </Card>
  );
}
