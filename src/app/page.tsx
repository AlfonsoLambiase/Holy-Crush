import {HomeScreen} from "@/components/HomeScreen";
import {LanguageProvider} from "@/language/LanguageProvider";

export default function Home() {
  return (
    <main>
      <LanguageProvider>
        <HomeScreen />
      </LanguageProvider>
    </main>
  );
}
