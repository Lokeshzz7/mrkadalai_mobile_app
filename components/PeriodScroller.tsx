import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View, Dimensions } from 'react-native';

const ITEM_WIDTH = 55;
const SCREEN_WIDTH = Dimensions.get('window').width;
const H_PADDING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

export type Mode = 'Day' | 'Week' | 'Month' | 'Year';

const monthNames = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

// format Date → "YYYY-MM-DD"
const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd= String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
};

// build days of month
const buildMonthDays = (year: number, month: number) => {
  const total = new Date(year, month+1, 0).getDate();
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(year, month, i+1);
    return {
      fullDate: formatDate(d),
      dateObj: d,
      label1: d.toLocaleDateString('en-US',{ weekday: 'short' }),
      label2: String(d.getDate())
    };
  });
};

// Jan–Dec of a year
const buildMonths = (year: number) =>
  monthNames.map((mn, idx) => {
    const d = new Date(year, idx, 1);
    return {
      fullDate: formatDate(d),
      dateObj: d,
      label1: mn.slice(0,3),
      label2: ''
    };
  });

// future years
const buildFutureYears = (startYear: number) =>
  Array.from({ length: 30 }, (_, i) => {
    const y = startYear + i;
    const d = new Date(y, 0, 1);
    return {
      fullDate: formatDate(d),
      dateObj: d,
      label1: String(y),
      label2: ''
    };
  });

// decades
const buildDecades = (year: number) => {
  const base = Math.floor(year/10)*10;
  return Array.from({ length: 10 }, (_, i) => {
    const d = new Date(base + i*10, 0, 1);
    return {
      fullDate: formatDate(d),
      dateObj: d,
      label1: `${base + i*10}s`,
      label2: ''
    };
  });
};

interface PeriodItem {
  fullDate: string;
  dateObj: Date;
  label1: string;
  label2: string;
}

interface Props {
  mode: Mode;
  selectedDate: string;
  selectedMonth: number;
  selectedYear: number;
  onSelectDate: (d: string) => void;
  onSelectMonth?: (m: number) => void;
  onSelectYear?: (y: number) => void;
}

export default function PeriodScroller({
  mode,
  selectedDate,
  selectedMonth,
  selectedYear,
  onSelectDate,
  onSelectMonth,
  onSelectYear
}: Props) {
  const [items, setItems] = useState<PeriodItem[]>([]);
  const listRef = useRef<FlatList<PeriodItem>>(null);

  useEffect(() => {
    if (mode === 'Day')       setItems(buildMonthDays(selectedYear, selectedMonth));
    else if (mode === 'Week') setItems(buildMonths(selectedYear));
    else if (mode === 'Month')setItems(buildFutureYears(selectedYear));
    else                      setItems(buildDecades(selectedYear));
  }, [mode, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!items.length) return;
    const d = new Date(selectedDate);
    let idx = 0;
    if (mode === 'Day') {
      idx = items.findIndex(i => i.fullDate === selectedDate);
    } else if (mode === 'Week') {
      idx = items.findIndex(i => i.dateObj.getMonth() === d.getMonth());
    } else if (mode === 'Month') {
      idx = items.findIndex(i => i.dateObj.getFullYear() === d.getFullYear());
    } else {
      const base = Math.floor(d.getFullYear()/10)*10;
      idx = items.findIndex(i => i.dateObj.getFullYear() === base);
    }
    if (idx >= 0) {
      setTimeout(() =>
        listRef.current?.scrollToIndex({ index: idx, viewPosition: 0.5 })
      , 50);
    }
  }, [items, selectedDate, mode]);

  return (
    <View style={{ height: 80, marginBottom: 16 }}>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: H_PADDING }}
        keyExtractor={i => i.fullDate}
        getItemLayout={(_,i) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH*i,
          index: i
        })}
        renderItem={({ item }) => {
          const isSel = (() => {
            const d = new Date(selectedDate);
            if (mode === 'Day') return item.fullDate === selectedDate;
            if (mode === 'Week') return item.dateObj.getMonth() === d.getMonth();
            if (mode === 'Month') return item.dateObj.getFullYear() === d.getFullYear();
            return item.dateObj.getFullYear() === Math.floor(d.getFullYear()/10)*10;
          })();
          return (
            <Pressable
              onPress={() => {
                onSelectDate(item.fullDate);
                if (mode === 'Day') {
                  onSelectMonth?.(item.dateObj.getMonth());
                  onSelectYear?.(item.dateObj.getFullYear());
                }
              }}
              className={`
                w-[55px] m-[9px] p-2 items-center justify-center
                border-b-2 ${isSel?'border-blue-600':'border-transparent'}
              `}
            >
              <Text className={`text-lg font-bold ${isSel?'text-blue-600':'text-gray-800'}`}>
                {item.label1}
              </Text>
              {item.label2 !== '' && (
                <Text className={`text-lg font-bold ${isSel?'text-blue-600':'text-gray-800'}`}>
                  {item.label2}
                </Text>
              )}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

// import React, { useEffect, useRef, useState } from 'react';
// import { FlatList, Pressable, Text, View, Dimensions } from 'react-native';

// const ITEM_WIDTH = 55;
// const SCREEN_WIDTH = Dimensions.get('window').width;
// const H_PADDING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

// const monthNames = [
//   'January','February','March','April','May','June',
//   'July','August','September','October','November','December'
// ];

// // format Date → "YYYY-MM-DD"
// const formatDate = (d: Date) => {
//   const y = d.getFullYear();
//   const m = String(d.getMonth()+1).padStart(2,'0');
//   const dd = String(d.getDate()).padStart(2,'0');
//   return `${y}-${m}-${dd}`;
// };

// // build all days of a given month
// const buildMonthDays = (year: number, month: number) => {
//   const total = new Date(year, month+1, 0).getDate();
//   return Array.from({ length: total }, (_, i) => {
//     const d = new Date(year, month, i+1);
//     return {
//       fullDate: formatDate(d),
//       dateObj: d,
//       label1: d.toLocaleDateString('en-US',{ weekday: 'short' }),
//       label2: String(d.getDate()),
//     };
//   });
// };

// // build 12 months (for Week mode scroller)
// const buildMonths = (year: number) =>
//   monthNames.map((mn, idx) => {
//     const d = new Date(year, idx, 1);
//     return {
//       fullDate: formatDate(d),
//       dateObj: d,
//       label1: mn.slice(0,3),
//       label2: '',
//     };
//   });

// // build future years only (for Month mode scroller)
// const buildFutureYears = (startYear: number, count = 30) =>
//   Array.from({ length: count }, (_, i) => {
//     const y = startYear + i;
//     const d = new Date(y, 0, 1);
//     return {
//       fullDate: formatDate(d),
//       dateObj: d,
//       label1: String(y),
//       label2: '',
//     };
//   });

// // build decades (for Year mode scroller)
// const buildDecades = (year: number, count = 10) => {
//   const baseDecade = Math.floor(year / 10) * 10;
//   return Array.from({ length: count }, (_, i) => {
//     const decade = baseDecade + i * 10;
//     const d = new Date(decade, 0, 1);
//     return {
//       fullDate: formatDate(d),
//       dateObj: d,
//       label1: `${decade}s`,
//       label2: '',
//     };
//   });
// };

// export type Mode = 'Day' | 'Week' | 'Month' | 'Year';

// interface Props {
//   mode: Mode;
//   selectedDate: string;            // "YYYY-MM-DD"
//   selectedMonth: number;           // 0–11
//   selectedYear: number;
//   onSelectDate: (d: string) => void;
//   onSelectMonth?: (m: number) => void; // only in Day mode
//   onSelectYear?: (y: number) => void;  // only in Day mode
// }

// // ─── Define explicit item type ─────────────────────────────
// interface PeriodItem {
//   fullDate: string;
//   dateObj: Date;
//   label1: string;
//   label2: string;
// }
// // ────────────────────────────────────────────────────────────

// export default function PeriodScroller({
//   mode, selectedDate, selectedMonth, selectedYear,
//   onSelectDate, onSelectMonth, onSelectYear
// }: Props) {
//   // ─ use typed state rather than typeof buildMonthDays ─
//   const [items, setItems] = useState<PeriodItem[]>([]);
//   const listRef = useRef<FlatList<PeriodItem>>(null);

//   useEffect(() => {
//     if (mode === 'Day') {
//       setItems(buildMonthDays(selectedYear, selectedMonth));
//     } else if (mode === 'Week') {
//       setItems(buildMonths(selectedYear));
//     } else if (mode === 'Month') {
//       setItems(buildFutureYears(selectedYear));
//     } else {
//       setItems(buildDecades(selectedYear));
//     }
//   }, [mode, selectedDate, selectedMonth, selectedYear]);

//   // auto-scroll to selectedDate
//   useEffect(() => {
//     const idx = items.findIndex(item => item.fullDate === selectedDate);
//     if (idx >= 0) {
//       setTimeout(() =>
//         listRef.current?.scrollToIndex({ index: idx, viewPosition: 0.5 })
//       , 50);
//     }
//   }, [items, selectedDate]);

//   return (
//     <View style={{ height: 80, marginBottom: 16 }}>
//       <FlatList
//         ref={listRef}
//         data={items}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         contentContainerStyle={{ paddingHorizontal: H_PADDING }}
//         keyExtractor={item => item.fullDate}
//         getItemLayout={(_, i) => ({
//           length: ITEM_WIDTH,
//           offset: ITEM_WIDTH * i,
//           index: i
//         })}
//         renderItem={({ item }) => {
//           const isSel = item.fullDate === selectedDate;
//           return (
//             <Pressable
//               onPress={() => {
//                 onSelectDate(item.fullDate);
//                 if (mode === 'Day') {
//                   onSelectMonth?.(item.dateObj.getMonth());
//                   onSelectYear?.(item.dateObj.getFullYear());
//                 }
//               }}
//               className={`
//                 w-[55px] m-[9px] p-2 items-center justify-center
//                 border-b-2 ${isSel ? 'border-blue-600' : 'border-transparent'}
//               `}
//             >
//               <Text className={`text-lg font-bold ${isSel ? 'text-blue-600' : 'text-gray-800'}`}>
//                 {item.label1}
//               </Text>
//               {item.label2 !== '' && (
//                 <Text className={`text-lg font-bold ${isSel ? 'text-blue-600' : 'text-gray-800'}`}>
//                   {item.label2}
//                 </Text>
//               )}
//             </Pressable>
//           );
//         }}
//       />
//     </View>
//   );
// }
