import { columns } from "./GeneralQueries/Columns";
import { DataTable } from "./GeneralQueries/DataTable";

export type GeneralQueriesProps = {
  sid: string;
  donor: string;
  donorId: string;
  test: string;
  stage: string;
  queryMode: "Text" | "Huddle" | "Video Call";
  device: string;
  dateNdTime: string;
  status: "In Progress" | "Awaiting Response";
};

export async function getData(): Promise<GeneralQueriesProps[]> {
  return [
    {
      sid: "1",
      donor: "John Doe",
      donorId: "12345",
      test: "Blood Test",
      stage: "Initial",
      queryMode: "Text",
      device: "Windows 11 Pro",
      dateNdTime: "2024-03-15 10:00:00",
      status: "In Progress",
    },
    {
      sid: "2",
      donor: "Jane Doe",
      donorId: "12346",
      test: "Blood Test",
      stage: "Initial",
      queryMode: "Huddle",
      device: "Macbook M1 Pro",
      dateNdTime: "2024-03-15 11:30:00",
      status: "Awaiting Response",
    },
    {
      sid: "3",
      donor: "John Smith",
      donorId: "12347",
      test: "Blood Test",
      stage: "Initial",
      queryMode: "Video Call",
      device: "iPhone 16 Pro Max",
      dateNdTime: "2024-03-15 12:45:00",
      status: "Awaiting Response",
    },
    {
      sid: "4",
      donor: "Sarah Wilson",
      donorId: "12348",
      test: "Blood Test",
      stage: "Follow-up",
      queryMode: "Text",
      device: "Samsung Galaxy S24 Ultra",
      dateNdTime: "2024-03-15 13:15:00",
      status: "In Progress",
    },
    {
      sid: "5",
      donor: "Michael Brown",
      donorId: "12349",
      test: "Blood Test",
      stage: "Initial",
      queryMode: "Huddle",
      device: "MacBook Air M2",
      dateNdTime: "2024-03-15 14:20:00",
      status: "Awaiting Response",
    },
    {
      sid: "6",
      donor: "Emily Davis",
      donorId: "12350",
      test: "Blood Test",
      stage: "Follow-up",
      queryMode: "Video Call",
      device: "iPad Pro M2",
      dateNdTime: "2024-03-15 15:00:00",
      status: "In Progress",
    },
    {
      sid: "7",
      donor: "David Miller",
      donorId: "12351",
      test: "Blood Test",
      stage: "Initial",
      queryMode: "Text",
      device: "Google Pixel 8 Pro",
      dateNdTime: "2024-03-15 15:45:00",
      status: "Awaiting Response",
    },
    {
      sid: "8",
      donor: "Lisa Anderson",
      donorId: "12352",
      test: "Blood Test",
      stage: "Follow-up",
      queryMode: "Huddle",
      device: "Mac Studio M2 Ultra",
      dateNdTime: "2024-03-15 16:30:00",
      status: "In Progress",
    },
    {
      sid: "9",
      donor: "James Wilson",
      donorId: "12353",
      test: "Blood Test",
      stage: "Initial",
      queryMode: "Video Call",
      device: "Surface Laptop 5",
      dateNdTime: "2024-03-15 17:15:00",
      status: "Awaiting Response",
    },
    {
      sid: "10",
      donor: "Emma Thompson",
      donorId: "12354",
      test: "Blood Test",
      stage: "Follow-up",
      queryMode: "Text",
      device: "iPhone 15 Pro",
      dateNdTime: "2024-03-15 18:00:00",
      status: "In Progress",
    },
    {
      sid: "11",
      donor: "Robert Clark",
      donorId: "12355",
      test: "Blood Test",
      stage: "Initial",
      queryMode: "Huddle",
      device: "Ubuntu Linux 22.04",
      dateNdTime: "2024-03-15 18:45:00",
      status: "Awaiting Response",
    },
  ];
}

export default async function GeneralQueries() {
  const data = await getData();
  return (
    <div className="mx-auto w-full">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
