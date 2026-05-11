import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  icon: React.ReactNode;
  label: string;
  onPress?: () => void;
}

export default function SocialButton({ icon, label, onPress }: Props) {
  return (
    <TouchableOpacity
      className="mb-3 flex-row items-center rounded-2xl border border-gray-200 px-4 py-3.5"
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View className="w-6 items-center">{icon}</View>
      <Text className="flex-1 text-center text-[14px] font-poppins-medium text-[#001328]">
        {label}
      </Text>
    </TouchableOpacity>
  );
}
