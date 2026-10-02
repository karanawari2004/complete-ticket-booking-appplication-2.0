const API =
	import.meta.env.VITE_API_URL ||
	(import.meta.env.DEV
		? "http://localhost:4001"
		: "https://complete-ticket-booking-backend-2-0-2.onrender.com");

export default API;
