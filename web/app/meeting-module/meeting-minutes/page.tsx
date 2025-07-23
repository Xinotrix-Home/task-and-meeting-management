import MeetingMinutesForm from './MeetingMinutesForm';

export default function MeetingMinutesPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 py-10 px-4">
            <div className="max-w-5xl mx-auto shadow-xl bg-white rounded-xl p-8">
                <h1 className="text-3xl font-bold mb-8 text-center text-primary">
                    Meeting Minutes
                </h1>
                <MeetingMinutesForm />
            </div>
        </div>
    );
}
