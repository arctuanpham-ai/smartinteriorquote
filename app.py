import streamlit as st
import google.generativeai as genai

# --- CẤU HÌNH TRANG WEB ---
st.set_page_config(
    page_title="My AI App",
    page_icon="🤖",
    layout="centered"
)

st.title("🤖 Trợ lý AI của tôi")

# --- LẤY API KEY TỪ HỆ THỐNG BẢO MẬT ---
# Đảm bảo bạn đã cài đặt key trong Streamlit Secrets
try:
    api_key = st.secrets["GEMINI_API_KEY"]
except KeyError:
    st.error("⚠️ Chưa tìm thấy API Key. Hãy cấu hình trong phần Secrets của Streamlit.")
    st.stop()

genai.configure(api_key=api_key)

# --- CẤU HÌNH MÔ HÌNH (QUAN TRỌNG) ---
# 1. Bạn hãy copy nội dung 'System Instructions' trong Google AI Studio
# 2. Dán đè vào đoạn văn bản giữa 3 dấu nháy kép bên dưới
SYSTEM_PROMPT = """
App báo giá nội thất thông minh dựa trên hình ảnh
"""

# Cấu hình tham số sinh văn bản (giống bên phải màn hình AI Studio)
generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 64,
  "max_output_tokens": 8192,
}

# Khởi tạo Model
@st.cache_resource
def load_model():
    return genai.GenerativeModel(
        model_name="gemini-1.5-flash", # Hoặc "gemini-1.5-pro" tùy bạn chọn
        generation_config=generation_config,
        system_instruction=SYSTEM_PROMPT
    )

model = load_model()

# --- XỬ LÝ LỊCH SỬ CHAT ---
# Khởi tạo lịch sử nếu chưa có
if "messages" not in st.session_state:
    st.session_state.messages = []

# Hiển thị lại các tin nhắn cũ trên màn hình
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# --- XỬ LÝ KHI NGƯỜI DÙNG NHẬP LIỆU ---
if prompt := st.chat_input("Nhập câu hỏi của bạn ở đây..."):
    # 1. Hiển thị câu hỏi của người dùng
    with st.chat_message("user"):
        st.markdown(prompt)
    # Lưu vào lịch sử
    st.session_state.messages.append({"role": "user", "content": prompt})

    # 2. Gửi qua Google Gemini để lấy câu trả lời
    try:
        # Tạo phiên chat mới với lịch sử cũ
        chat_history = [
            {"role": "user" if msg["role"] == "user" else "model", "parts": [msg["content"]]} 
            for msg in st.session_state.messages[:-1] # Lấy tất cả trừ câu mới nhất vừa nhập
        ]
        
        chat = model.start_chat(history=chat_history)
        response = chat.send_message(prompt)

        # 3. Hiển thị câu trả lời của AI
        with st.chat_message("assistant"):
            st.markdown(response.text)
        
        # Lưu câu trả lời vào lịch sử
        st.session_state.messages.append({"role": "assistant", "content": response.text})

    except Exception as e:
        st.error(f"Đã xảy ra lỗi: {e}")
