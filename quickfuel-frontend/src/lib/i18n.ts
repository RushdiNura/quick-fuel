export type Lang = "en" | "am" | "om";

export const I18N: Record<Lang, Record<string, string>> = {
  en: {
    driver: "Driver", operator: "Operator", station_owner: "Station Owner", admin: "Admin",
    nearbyStations: "Nearby stations", yourReservations: "Your reservations", reserveFuel: "Reserve fuel",
    continueBtn: "Continue", requestRefund: "Request refund", weeklyQuota: "Weekly quota",
    litresLeft: "L left", reservationConfirmed: "Reservation confirmed", done: "Done",
    verifyPickup: "Verify pickup code", verify: "Verify", authorise: "Authorise & dispense", complete: "Complete",
    createAccount: "Create account", registerStation: "Register station", approve: "Approve", reject: "Reject",
    mapView: "Map view", listView: "List view", fuelAvailable: "Fuel available", lowStock: "Low stock",
    outOfStock: "Out of stock", signIn: "Sign in", signOut: "Sign out", email: "Email", password: "Password",
  },
  am: {
    driver: "ሹፌር", operator: "ኦፕሬተር", station_owner: "የጣቢያ ባለቤት", admin: "አስተዳዳሪ",
    nearbyStations: "አቅራቢያ ያሉ ጣቢያዎች", yourReservations: "የእርስዎ ማስያዣዎች", reserveFuel: "ነዳጅ ያስይዙ",
    continueBtn: "ቀጥል", requestRefund: "ተመላሽ ይጠይቁ", weeklyQuota: "ሳምንታዊ ኮታ",
    litresLeft: "ሊትር ቀርቷል", reservationConfirmed: "ማስያዣው ተረጋግጧል", done: "ተጠናቋል",
    verifyPickup: "የመውሰጃ ኮድ ያረጋግጡ", verify: "አረጋግጥ", authorise: "ፍቀድ እና አከፋፍል", complete: "አጠናቅቅ",
    createAccount: "መለያ ይፍጠሩ", registerStation: "ጣቢያ ይመዝግቡ", approve: "አጽድቅ", reject: "ውድቅ አድርግ",
    mapView: "የካርታ እይታ", listView: "የዝርዝር እይታ", fuelAvailable: "ነዳጅ አለ", lowStock: "ውስን ክምችት",
    outOfStock: "ነዳጅ የለም", signIn: "ግባ", signOut: "ውጣ", email: "ኢሜይል", password: "የይለፍ ቃል",
  },
  om: {
    driver: "Konkolaachisaa", operator: "Ophireetara", station_owner: "Abbaa Buufataa", admin: "Bulchaa",
    nearbyStations: "Buufattoota Dhihoo", yourReservations: "Qabsiiswwan Kee", reserveFuel: "Boba'aa Qabsiisi",
    continueBtn: "Itti fufi", requestRefund: "Deebii Gaafadhu", weeklyQuota: "Hangii Torbanii",
    litresLeft: "Liitira hafe", reservationConfirmed: "Qabsiisni Mirkanaa'eera", done: "Xumure",
    verifyPickup: "Kodii Fudhannaa Mirkaneessi", verify: "Mirkaneessi", authorise: "Hayyamsiisi fi Kenni", complete: "Xumuri",
    createAccount: "Kaayyoo Uumi", registerStation: "Buufata Galmeessi", approve: "Mirkaneessi", reject: "Didi",
    mapView: "Mul'ata Kaartaa", listView: "Mul'ata Tarreeffamaa", fuelAvailable: "Boba'aan Jira", lowStock: "Kuusaan Xiqqaate",
    outOfStock: "Boba'aan Hin Jiru", signIn: "Seeni", signOut: "Ba'i", email: "Imeelii", password: "Jecha Iccitii",
  },
};
