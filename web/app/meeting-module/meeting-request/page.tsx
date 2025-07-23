import MeetingForm from './MeetingForm';

export default function MeetingRequestPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-100 py-10 px-4">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl p-8">
                <h1 className="text-3xl font-bold mb-8 text-center text-primary">
                    Meeting Request
                </h1>
                <MeetingForm />
            </div>
        </div>
    );
}
