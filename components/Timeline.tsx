import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/FontAwesome';
import { Mode } from '@/components/PeriodScroller';

type Activity = {
  name: string;
  description: string;
  place: string;
  timeLabel: string;
  priority: string;
};
type ActivitiesMap = { [slotId: string]: Activity[] };

const DAY_SLOTS = [
  { time: '12:00 AM', id: '12am' },
  { time: '1:00 AM', id: '1am' },
  { time: '2:00 AM', id: '2am' },
  { time: '3:00 AM', id: '3am' },
  { time: '4:00 AM', id: '4am' },
  { time: '5:00 AM', id: '5am' },
  { time: '6:00 AM', id: '6am' },
  { time: '7:00 AM', id: '7am' },
  { time: '8:00 AM', id: '8am' },
  { time: '9:00 AM', id: '9am' },
  { time: '10:00 AM', id: '10am' },
  { time: '11:00 AM', id: '11am' },
  { time: '12:00 PM', id: '12pm' },
  { time: '1:00 PM', id: '1pm' },
  { time: '2:00 PM', id: '2pm' },
  { time: '3:00 PM', id: '3pm' },
  { time: '4:00 PM', id: '4pm' },
  { time: '5:00 PM', id: '5pm' },
  { time: '6:00 PM', id: '6pm' },
  { time: '7:00 PM', id: '7pm' },
  { time: '8:00 PM', id: '8pm' },
  { time: '9:00 PM', id: '9pm' },
  { time: '10:00 PM', id: '10pm' },
  { time: '11:00 PM', id: '11pm' }
];

// Week slots
const WEEK_SLOTS = [
  { time: 'Week 1', id: 'w1' },
  { time: 'Week 2', id: 'w2' },
  { time: 'Week 3', id: 'w3' },
  { time: 'Week 4', id: 'w4' },
];

// Month slots
const MONTH_SLOTS = [
  { time: 'January', id: '0' },
  { time: 'February', id: '1' },
  { time: 'March', id: '2' },
  { time: 'April', id: '3' },
  { time: 'May', id: '4' },
  { time: 'June', id: '5' },
  { time: 'July', id: '6' },
  { time: 'August', id: '7' },
  { time: 'September', id: '8' },
  { time: 'October', id: '9' },
  { time: 'November', id: '10' },
  { time: 'December', id: '11' }
];

// Replace the constant WEEK_SLOTS with a function to dynamically calculate weeks
const getWeekSlots = (dateStr: string) => {
  // Parse the selected date
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();

  // Get the last day of the month (0 day of next month = last day of current month)
  const lastDay = new Date(year, month + 1, 0).getDate();

  // Calculate how many weeks this month has
  const totalWeeks = Math.ceil(lastDay / 7);

  // Create an array of week slots
  return Array.from({ length: totalWeeks }, (_, i) => {
    const weekNum = i + 1;
    const startDay = (i * 7) + 1;
    const endDay = Math.min((i + 1) * 7, lastDay);
    return {
      time: `Week ${weekNum} (${startDay}-${endDay})`,
      id: `w${weekNum}`
    };
  });
};

// Year slots
const buildYearSlots = (dateStr: string) => {
  const y = new Date(dateStr).getFullYear();
  const base = Math.floor(y / 10) * 10;
  return Array.from({ length: 10 }, (_, i) => ({
    time: `${base + i}`, id: `${base + i}`
  }));
};

const TimelineActivity = ({
  name, description, timeLabel, place, priority, onPress
}: {
  name: string;
  description: string;
  timeLabel: string;
  place: string;
  priority: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className={`
      bg-componentbgbeige mb-2 px-2 py-4 rounded-xl shadow-md items-start w-full
      border-2 border-blue-800
    `}
    onPress={onPress}
  >
    <Text className='text-5xl font-neue text-pritext'>{name}</Text>
    <View className='flex flex-row gap-5 items-center pb-2'>
      <Text className='text-2xl font-semibold text-pritext'>{timeLabel}</Text>
      <View className={`
        text-sm px-3 py-1 rounded-xl ${priority === 'high' ? 'bg-red-500' :
          priority === 'medium' ? 'bg-orange-400' : 'bg-green-500'
        }
      `}>
        <Text className="text-white text-sm capitalize">{priority}</Text>
      </View>
    </View>
    <View className='mb-3'>
      <Text className='font-extrabold text-xl'>Description :</Text>
      <Text className='text-sectext'>{description}</Text>
    </View>
  </TouchableOpacity>
);

export default function Timeline({
  mode,
  selectedDate
}: {
  mode: Mode;
  selectedDate: string;
}) {
  // state: mode → periodKey → slotId → Activity[]
  const [state, setState] = useState<{
    Day: Record<string, ActivitiesMap>;
    Week: Record<string, ActivitiesMap>;
    Month: Record<string, ActivitiesMap>;
    Year: Record<string, ActivitiesMap>;
  }>({ Day: {}, Week: {}, Month: {}, Year: {} });

  // derive periodKey
  const d = new Date(selectedDate);
  const year = d.getFullYear(), month = d.getMonth();
  const periodKey = mode === 'Day'
    ? selectedDate
    : mode === 'Week'
      ? `${year}-${month}`
      : mode === 'Month'
        ? `${year}`
        : `${Math.floor(year / 10) * 10}`;

  // pick slots
  const slots = mode === 'Day'
    ? DAY_SLOTS
    : mode === 'Week'
      ? getWeekSlots(selectedDate)
      : mode === 'Month'
        ? MONTH_SLOTS
        : buildYearSlots(selectedDate);

  // fetch activities
  const currentMap = state[mode][periodKey] || {};

  // modal states
  const [showAdd, setShowAdd] = useState(false);
  const [selSlot, setSelSlot] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [place, setPlace] = useState('');
  const [prio, setPrio] = useState('');

  const addActivity = () => {
    if (!selSlot || !name) return;
    const label = slots.find(s => s.id === selSlot)!.time;
    setState(prev => {
      const modeMap = { ...prev[mode] };
      const pm = { ...(modeMap[periodKey] || {}) };
      const list = [...(pm[selSlot] || []), {
        name,
        description: desc,
        place,
        timeLabel: label,
        priority: prio
      }];
      pm[selSlot] = list;
      modeMap[periodKey] = pm;
      return { ...prev, [mode]: modeMap };
    });
    setShowAdd(false);
    setSelSlot(''); setName(''); setDesc(''); setPlace(''); setPrio('');
  };

  return (
    <View className="flex-1 p-4">
      {/* Header + Add */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-2xl font-bold">Timeline for Activities</Text>
        <TouchableOpacity
          className="bg-green-500 p-3 rounded-full"
          onPress={() => setShowAdd(true)}
        >
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrollable slots */}
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {slots.map(slot => {
          const arr = currentMap[slot.id] || [];
          return (
            <View key={slot.id} className="py-2">
              <View className="border-b-2 border-gray-300 pb-2">
                <View className="flex-row">
                  <Text className="text-lg text-gray-800 w-24">{slot.time}</Text>
                  <View className="flex-1">
                    {arr.length === 0
                      ? <Text className="text-gray-400">No Activity Scheduled</Text>
                      : arr.map((a, idx) => (
                        <TimelineActivity
                          key={idx}
                          name={a.name}
                          description={a.description}
                          timeLabel={a.timeLabel}
                          place={a.place}
                          priority={a.priority}
                          onPress={() => { }}
                        />
                      ))
                    }
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add Activity Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-center items-center bg-black bg-opacity-50"
        >
          <View className="bg-white p-6 rounded-lg w-4/5">
            <ScrollView>
              <Text className="text-xl font-semibold">Add Activity</Text>
              <Text className="mt-3">
                Select {mode === 'Day' ? 'Time' : mode === 'Week' ? 'Week' : mode === 'Month' ? 'Month' : 'Year'}
              </Text>
              <Picker
                selectedValue={selSlot}
                onValueChange={v => setSelSlot(v)}
                style={{ height: 60, width: '100%' }}
              >
                <Picker.Item label={`Select ${mode}`} value="" />
                {slots.map(s => (
                  <Picker.Item key={s.id} label={s.time} value={s.id} />
                ))}
              </Picker>

              <TextInput
                className="border-b-2 my-2 p-2"
                placeholder="Activity Name"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                className="border-b-2 my-2 p-2"
                placeholder="Activity Description"
                value={desc}
                onChangeText={setDesc}
              />
              <TextInput
                className="border-b-2 my-2 p-2"
                placeholder="Place"
                value={place}
                onChangeText={setPlace}
              />
              <Text className="mt-3">Priority</Text>
              <Picker
                selectedValue={prio}
                onValueChange={v => setPrio(v)}
                style={{ height: 60, width: '100%' }}
              >
                <Picker.Item label="Select priority" value="" />
                <Picker.Item label="High" value="high" />
                <Picker.Item label="Medium" value="medium" />
                <Picker.Item label="Low" value="low" />
              </Picker>

              <TouchableOpacity
                onPress={addActivity}
                className="bg-green-500 p-2 rounded-lg mt-3 border-b-2 border-gray-400"
              >
                <Text className="text-white text-center">Save Activity</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowAdd(false)}
                className="bg-red-500 p-2 rounded-lg mt-2 border-b-2 border-gray-400"
              >
                <Text className="text-white text-center">Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}


// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   TouchableOpacity,
//   Modal,
//   TextInput,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView
// } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import Icon from 'react-native-vector-icons/FontAwesome';

// // Import your Mode type
// import { Mode } from '@/components/PeriodScroller';

// type Activity = {
//   name: string;
//   description: string;
//   place: string;
//   timeLabel: string;
//   priority: string;
// };

// type ActivitiesMap = {
//   [slotId: string]: Activity[];
// };

// // 24-hour slots for Day mode
// const DAY_SLOTS = [
//   { time: '12:00 AM', id: '12am' },
//   { time: '1:00 AM',  id: '1am'  },
//   { time: '2:00 AM',  id: '2am'  },
//   { time: '3:00 AM',  id: '3am'  },
//   { time: '4:00 AM',  id: '4am'  },
//   { time: '5:00 AM',  id: '5am'  },
//   { time: '6:00 AM',  id: '6am'  },
//   { time: '7:00 AM',  id: '7am'  },
//   { time: '8:00 AM',  id: '8am'  },
//   { time: '9:00 AM',  id: '9am'  },
//   { time: '10:00 AM', id: '10am'},
//   { time: '11:00 AM', id: '11am'},
//   { time: '12:00 PM', id: '12pm'},
//   { time: '1:00 PM',  id: '1pm' },
//   { time: '2:00 PM',  id: '2pm' },
//   { time: '3:00 PM',  id: '3pm' },
//   { time: '4:00 PM',  id: '4pm' },
//   { time: '5:00 PM',  id: '5pm' },
//   { time: '6:00 PM',  id: '6pm' },
//   { time: '7:00 PM',  id: '7pm' },
//   { time: '8:00 PM',  id: '8pm' },
//   { time: '9:00 PM',  id: '9pm' },
//   { time: '10:00 PM', id: '10pm'},
//   { time: '11:00 PM', id: '11pm'},
// ];

// // 4-week slots for Week mode
// const WEEK_SLOTS = [
//   { time: 'Week 1', id: 'w1' },
//   { time: 'Week 2', id: 'w2' },
//   { time: 'Week 3', id: 'w3' },
//   { time: 'Week 4', id: 'w4' },
// ];

// // 12-month slots for Month mode
// const MONTH_SLOTS = [
//   { time: 'January',   id: '0' },
//   { time: 'February',  id: '1' },
//   { time: 'March',     id: '2' },
//   { time: 'April',     id: '3' },
//   { time: 'May',       id: '4' },
//   { time: 'June',      id: '5' },
//   { time: 'July',      id: '6' },
//   { time: 'August',    id: '7' },
//   { time: 'September', id: '8' },
//   { time: 'October',   id: '9' },
//   { time: 'November',  id: '10'},
//   { time: 'December',  id: '11'},
// ];

// // 10-year slots for Year mode (current decade)
// const buildYearSlots = (selectedYear: number) => {
//   const base = Math.floor(selectedYear / 10) * 10;
//   return Array.from({ length: 10 }, (_, i) => ({
//     time: `${base + i}`,
//     id: `${base + i}`
//   }));
// };

// // Reusable Timeline card (unchanged styles)
// const TimelineActivity = ({
//   name, description, timeLabel, place, priority, onPress
// }: {
//   name: string;
//   description: string;
//   timeLabel: string;
//   place: string;
//   priority: string;
//   onPress: () => void;
// }) => (
//   <TouchableOpacity
//     className={`
//       bg-componentbgbeige mb-2 px-2 py-4 rounded-xl shadow-md items-start w-full
//       border-2 border-blue-800
//     `}
//     onPress={onPress}
//   >
//     <Text className='text-5xl font-neue text-pritext'>{name}</Text>
//     <View className='flex flex-row gap-5 items-center pb-2'>
//       <Text className='text-2xl font-semibold text-pritext'>{timeLabel}</Text>
//       <View className={`
//         text-sm px-3 py-1 rounded-xl ${
//           priority === 'high'   ? 'bg-red-500' :
//           priority === 'medium' ? 'bg-orange-400' :
//           priority === 'low'    ? 'bg-green-500' : 'bg-gray-300'
//         }
//       `}>
//         <Text className="text-white text-sm capitalize">{priority}</Text>
//       </View>
//     </View>
//     <View className='mb-3'>
//       <Text className='font-extrabold text-xl'>Description :</Text>
//       <Text className='text-sectext'>{description}</Text>
//     </View>
//   </TouchableOpacity>
// );

// export default function Timeline({
//   mode,
//   selectedDate,
//   selectedMonth,
//   selectedYear
// }: {
//   mode: Mode;
//   selectedDate: string;
//   selectedMonth: number;
//   selectedYear: number;
// }) {
//   // holds all activities per mode → periodKey → slotId → Activity[]
//   const [activitiesState, setActivitiesState] = useState<{
//     Day:   Record<string, ActivitiesMap>;
//     Week:  Record<string, ActivitiesMap>;
//     Month: Record<string, ActivitiesMap>;
//     Year:  Record<string, ActivitiesMap>;
//   }>({
//     Day: {}, Week: {}, Month: {}, Year: {},
//   });

//   // derive a unique key for the current “period”
//   const periodKey = mode === 'Day'
//     ? selectedDate
//     : mode === 'Week'
//     ? `${selectedYear}-${selectedMonth}`
//     : mode === 'Month'
//     ? `${selectedYear}`
//     : `${Math.floor(selectedYear/10)*10}`;

//   // pick slots based on mode
//   const slots = mode === 'Day'
//     ? DAY_SLOTS
//     : mode === 'Week'
//     ? WEEK_SLOTS
//     : mode === 'Month'
//     ? MONTH_SLOTS
//     : buildYearSlots(selectedYear);

//   // get the map of slot → activities for this mode+period
//   const currentMap = (activitiesState[mode][periodKey] || {});

//   // add‐modal state
//   const [addVisible, setAddVisible]       = useState(false);
//   const [selSlot, setSelSlot]             = useState<string>('');
//   const [activityName, setActivityName]   = useState('');
//   const [activityDescription, setActivityDescription] = useState('');
//   const [activityPlace, setActivityPlace] = useState('');
//   const [activityPriority, setActivityPriority] = useState('');

//   const handleAdd = () => {
//     if (!selSlot || !activityName) return;
//     const timeLabel = slots.find(s => s.id === selSlot)!.time;
//     setActivitiesState(prev => {
//       const modeMap = { ...prev[mode] };
//       const periodMap = { ...(modeMap[periodKey] || {}) };
//       const list = [...(periodMap[selSlot] || []), {
//         name: activityName,
//         description: activityDescription,
//         place: activityPlace,
//         timeLabel,
//         priority: activityPriority
//       }];
//       modeMap[periodKey] = { ...periodMap, [selSlot]: list };
//       return { ...prev, [mode]: modeMap };
//     });
//     setAddVisible(false);
//     setSelSlot('');
//     setActivityName('');
//     setActivityDescription('');
//     setActivityPlace('');
//     setActivityPriority('');
//   };

//   return (
//     <View className="flex-1 p-4">
//       <View className="flex-row justify-between items-center mb-4">
//         <Text className="text-2xl font-bold">Timeline for Activities</Text>
//         <TouchableOpacity
//           className="bg-green-500 p-3 rounded-full"
//           onPress={() => setAddVisible(true)}
//         >
//           <Icon name="plus" size={20} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       <FlatList
//         data={slots}
//         keyExtractor={i => i.id}
//         showsVerticalScrollIndicator={false}
//         contentContainerStyle={{ paddingBottom: 80 }}
//         renderItem={({ item }) => {
//           const arr = currentMap[item.id] || [];
//           return (
//             <View className="py-2">
//               <View className="border-b-2 border-gray-300 pb-2">
//                 <View className="flex-row">
//                   <Text className="text-lg text-gray-800 w-24">
//                     {item.time}
//                   </Text>
//                   <View className="flex-1">
//                     {arr.length === 0
//                       ? <Text className="text-gray-400">No Activity Scheduled</Text>
//                       : arr.map((act, idx) => (
//                           <TimelineActivity
//                             key={idx}
//                             name={act.name}
//                             description={act.description}
//                             timeLabel={act.timeLabel}
//                             place={act.place}
//                             priority={act.priority}
//                             onPress={() => {}}
//                           />
//                         ))
//                     }
//                   </View>
//                 </View>
//               </View>
//             </View>
//           );
//         }}
//       />

//       {/* Add Activity Modal */}
//       <Modal visible={addVisible} transparent animationType="slide">
//         <KeyboardAvoidingView
//           behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//           className="flex-1 justify-center items-center bg-black bg-opacity-50"
//         >
//           <View className="bg-white p-6 rounded-lg w-4/5">
//             <ScrollView showsVerticalScrollIndicator={false}>
//               <Text className="text-xl font-semibold">Add Activity</Text>
//               <Text className="mt-3">
//                 Select {mode === 'Day'    ? 'Time'
//                        : mode === 'Week'   ? 'Week'
//                        : mode === 'Month'  ? 'Month'
//                        : 'Year'}
//               </Text>
//               <Picker
//                 selectedValue={selSlot}
//                 onValueChange={v => setSelSlot(v)}
//                 style={{ height: 60, width: '100%' }}
//               >
//                 <Picker.Item label={`Select ${mode}`} value="" />
//                 {slots.map(s => (
//                   <Picker.Item key={s.id} label={s.time} value={s.id} />
//                 ))}
//               </Picker>

//               <TextInput
//                 className="border-b-2 my-2 p-2"
//                 placeholder="Activity Name"
//                 value={activityName}
//                 onChangeText={setActivityName}
//               />
//               <TextInput
//                 className="border-b-2 my-2 p-2"
//                 placeholder="Activity Description"
//                 value={activityDescription}
//                 onChangeText={setActivityDescription}
//               />
//               <TextInput
//                 className="border-b-2 my-2 p-2"
//                 placeholder="Place"
//                 value={activityPlace}
//                 onChangeText={setActivityPlace}
//               />

//               <Text className="mt-3">Priority</Text>
//               <Picker
//                 selectedValue={activityPriority}
//                 onValueChange={v => setActivityPriority(v)}
//                 style={{ height: 60, width: '100%' }}
//               >
//                 <Picker.Item label="Select priority" value="" />
//                 <Picker.Item label="High" value="high" />
//                 <Picker.Item label="Medium" value="medium" />
//                 <Picker.Item label="Low" value="low" />
//               </Picker>

//               <TouchableOpacity
//                 onPress={handleAdd}
//                 className="bg-green-500 p-2 rounded-lg mt-3 border-b-2 border-gray-400"
//               >
//                 <Text className="text-white text-center">Save Activity</Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 onPress={() => setAddVisible(false)}
//                 className="bg-red-500 p-2 rounded-lg mt-2 border-b-2 border-gray-400"
//               >
//                 <Text className="text-white text-center">Cancel</Text>
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         </KeyboardAvoidingView>
//       </Modal>
//     </View>
//   );
// }
