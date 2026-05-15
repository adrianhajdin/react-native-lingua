Read AGENTS.md first and follow it strictly.

Integrate language selection state. Store the selected language using Zustand with the modern `@react-native-async-storage/async-storage` package. If an authenticated user has no selected language, route them to the language selection screen. Only after selecting a language should they access the home route (/). Preserve the existing UI exactly.

Add a button on home screen route to clear async storage for testing language selection state functionality