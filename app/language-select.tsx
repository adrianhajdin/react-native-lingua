import { images } from "@/constants/images";
import { LANGUAGES } from "@/data/languages";
import { posthog } from "@/lib/posthog";
import { useLanguageStore } from "@/store/languageStore";
import { Language, LanguageCode } from "@/types/learning";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LanguageSelectScreen() {
  const { setSelectedLanguage } = useLanguageStore();
  const [selectedCode, setSelectedCode] = useState<string>(LANGUAGES[0].code);
  const [search, setSearch] = useState("");

  const filtered = LANGUAGES.filter((lang) =>
    lang.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Language }) => {
    const isSelected = item.code === selectedCode;
    return (
      <TouchableOpacity
        onPress={() => setSelectedCode(item.code)}
        className={`flex-row items-center py-3.5 px-3.5 bg-white border-[1.5px] rounded-[14px] ${isSelected ? "bg-[rgba(108,78,245,0.08)] border-lingua-purple" : "border-transparent"}`}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.flag }} style={styles.flag} />
        <View className="flex-1 ml-3">
          <Text className="font-poppins-semibold text-base text-text-primary">
            {item.name}
          </Text>
          <Text className="body-sm text-text-secondary">
            {item.learners} learners
          </Text>
        </View>
        {isSelected ? (
          <View className="w-6.5 h-6.5 rounded-full bg-lingua-purple items-center justify-center">
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-8 h-8 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="#001328" />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-poppins-semibold text-lg text-text-primary">
          Choose a language
        </Text>
        <View className="w-8" />
      </View>

      {/* Search */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center bg-surface rounded-2xl px-4 py-3">
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages"
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Popular label */}
      <Text className="px-4 font-poppins-semibold text-base text-text-primary mb-2">
        Popular
      </Text>

      {/* Language list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => (
          <View className="h-px bg-gray-200" />
        )}
      />

      {/* Confirm button */}
      <View className="px-4 pt-3 pb-3">
        <TouchableOpacity
          className="bg-lingua-purple rounded-2xl items-center py-4"
          activeOpacity={0.85}
          testID="language-confirm-button"
          onPress={() => {
            const selectedLang = LANGUAGES.find((l) => l.code === selectedCode);
            posthog.capture("language_selected", {
              language_code: selectedCode,
              language_name: selectedLang?.name ?? selectedCode,
            });
            setSelectedLanguage(selectedCode as LanguageCode);
            router.replace("/");
          }}
        >
          <Text className="font-poppins-semibold text-base text-white">
            Continue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Earth image */}
      <Image source={images.earth} style={styles.earthImage} resizeMode="cover" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flag: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: "Poppins-Regular",
    fontSize: 14,
    color: "#001328",
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  earthImage: {
    width: "100%",
    height: 130,
  },
});
