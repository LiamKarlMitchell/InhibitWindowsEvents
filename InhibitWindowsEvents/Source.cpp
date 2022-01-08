#define WIN32_LEAN_AND_MEAN // Note: This could use WIN_NT 403
#include <windows.h>
#include <stdio.h>

HHOOK llMouseHook = NULL;
HHOOK llKeyboardHook = NULL;
bool EnableHooks = true;

// Just for debug/log purposes.
// char Message[200] = { 0 };

// Note: Any long running interactions in the hooks should be done in your own thread or windows will likely discard the message and system will be unstable.
// Note for debugging: Ctrl+Alt+Delete to show the window options screen (Log off/Task Manager etc) then closing it with Esc fixed any mouse instability I had early on.
// Increasing timeout in registry helped a lot too.
// Return 1 from hooks to prevent event.
// Return a call to CallNextHooksEx for any nCode < 0 or if not handling event.

// lParam [in] Pointer to a MSLLHOOKSTRUCT structure.
LRESULT CALLBACK LowLevelMouseProc(int nCode, WPARAM wParam, LPARAM lParam)
{
	if (nCode >= 0) {
		MSLLHOOKSTRUCT *mouse = reinterpret_cast<MSLLHOOKSTRUCT *>(lParam);

		if (EnableHooks) {
			switch (wParam) {
			case WM_XBUTTONDOWN:
			case WM_XBUTTONUP:
				//sprintf(Message, "WM_XBUTTONUP #%i Suppressed!", button);
				//puts(Message);
				// Note: Can be used to get the extra mouse button index. (I didn't care just wanted to mute them all).
				// int button = mouse->mouseData >> 16;
				return 1;
				break;
			}

			// Get window handle under cursor and the mouse location.
			//HWND hiWnd = WindowFromPoint(p->pt);
			//if (hiWnd)
			//{
			//	POINT pt = p->pt;
			//	ScreenToClient(hiWnd, &pt);

			//	if (IsWindowUnicode(hiWnd))
			//	{
			//		LPWSTR buf = (LPWSTR)GlobalAlloc(GMEM_FIXED, 33 * sizeof(WCHAR));
			//		if (buf)
			//		{
			//			swprintf(buf, 33, L"X:%ld, Y:%ld", pt.x, pt.y);
			//			SendMessageW(hiWnd, WM_SETTEXT, 0, (LPARAM)buf);
			//			GlobalFree(buf);
			//		}
			//	}
			//	else
			//	{
			//		LPSTR buf = (LPSTR)GlobalAlloc(GMEM_FIXED, 33);
			//		if (buf)
			//		{
			//			snprintf(buf, 33, "X:%ld, Y:%ld", pt.x, pt.y);
			//			SendMessageA(hiWnd, WM_SETTEXT, 0, (LPARAM)buf);
			//			GlobalFree(buf);
			//		}
			//	}
			//}
		}
	}
	return CallNextHookEx(llMouseHook, nCode, wParam, lParam);
}

// lParam [in] Pointer to a KBDLLHOOKSTRUCT structure.
LRESULT CALLBACK LowLevelKeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
	KBDLLHOOKSTRUCT *keyboard = reinterpret_cast<KBDLLHOOKSTRUCT *>(lParam);

	if (nCode >= 0) {
		UINT msg = wParam;
		WPARAM w = keyboard->vkCode;
		LPARAM l = 1 | (keyboard->scanCode << 16);
		if (keyboard->flags & LLKHF_EXTENDED)
			l |= 0x1000000;
		if (wParam == WM_KEYUP || wParam == WM_SYSKEYUP)
			l |= 0xC0000000;

		// For debugging purposes.
#ifdef _DEBUG
		printf("wParam: %X VK: %X Scan: %X L: %X\n", wParam, w, w, l);
#endif

		// Suppressing left windows key.
		if (w == VK_LWIN && EnableHooks) {
			switch (wParam) {
				case WM_KEYDOWN: // use KEYDOWN
				case WM_SYSKEYDOWN: { // use SYSKEYDOWN	
					keybd_event(VK_F24, VK_F24, KEYEVENTF_EXTENDEDKEY | 0, 0);
					break;
				}
				case WM_KEYUP: // use regular keyup
				{
					keybd_event(VK_F24, VK_F24, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, 0);
					break;
				}
			}
			return 1;
		}
		// Detect Alt+Scroll Lock Up.
		if (w == VK_SCROLL && keyboard->flags & LLKHF_ALTDOWN && (wParam == WM_KEYUP || wParam == WM_SYSKEYUP)) {
			if (EnableHooks) {
				EnableHooks = false;
				puts("Hooks disabled.");
			}
			else {
				EnableHooks = true;
				puts("Hooks enabled.");
			}
			return 1;
		}
	}
	return CallNextHookEx(llKeyboardHook, nCode, wParam, lParam);
}

int WINAPI
WinMain(HINSTANCE hInstance,      // handle to current instance
	HINSTANCE hPrevInstance,      // handle to previous instance
	LPSTR lpCmdLine,              // command line
	int nCmdShow                  // show state
)
{
	// Puts into realtime priority. (Could cause unstability).
	// But should execute faster.
	SetPriorityClass(GetCurrentProcess(), REALTIME_PRIORITY_CLASS);

	AllocConsole();
	freopen("CON", "wt", stdout);

	puts("Inhibit Windows Events started...");

	// Note: This is just for debug purposes.
	// Print the user's LowLevelHooksTimeout registry key for debugging purposes.
	// From Windows 7+, Windows will silently remove badly behaving hooks
	// without telling the application. Users can tweak the timeout themselves
	// with this registry key. (200 ms is default)
	HKEY key = NULL;
	DWORD type = 0;
	DWORD value = 0;
	DWORD len = sizeof(DWORD);
	puts("Checking existance and value of the key HKEY_CURRENT_USER\\Control Panel\\Desktop\\LowLevelHooksTimeout.");
	if (RegOpenKeyExA(HKEY_CURRENT_USER, "Control Panel\\Desktop", NULL, KEY_READ, &key) == ERROR_SUCCESS) {
		LONG err = RegQueryValueExA(key, "LowLevelHooksTimeout", NULL, &type, reinterpret_cast<LPBYTE>(&value), &len);
		if (err == ERROR_SUCCESS && type == REG_DWORD) {
			printf_s("GlobalShortcutWin: Found LowLevelHooksTimeout with value = 0x%x that is %u ms\n", value, value);
			if (value < 200) {
				puts("A value too small on Windows 7 is known to cause system instability.");
				puts("Try killing explorer.exe or restarting if that occures and increase the value in the registry.");
			}
		}
		else if (err == ERROR_FILE_NOT_FOUND) {
			printf_s("GlobalShortcutWin: No LowLevelHooksTimeout registry key found.\n");
		}
		else {
			printf_s("GlobalShortcutWin: Error looking up LowLevelHooksTimeout. (Error: 0x%x, Type: 0x%x, Value: 0x%x)\n", err, type, value);
		}
	}

	// Tell the user what the suppressed actions are.
	puts("Suppressed actions are:");
	puts("Mouse extra buttons (Back and Forward in browser) Mouse 3 Mouse 4 etc.");
	puts("Left Windows Key");
	puts("ALT + Scroll Lock toggles the hooks so this combination and is also suppressed.");

	// Set up the hooks.
	llMouseHook = SetWindowsHookEx(WH_MOUSE_LL, LowLevelMouseProc, hInstance, 0);
	llKeyboardHook = SetWindowsHookEx(WH_KEYBOARD_LL, LowLevelKeyboardProc, hInstance, 0);

	MSG msg;
	msg.message = NULL; // Just in case msg is not 0'd out by default.

	// This is the message pump loop.
	// Needed or the system will go very unresponsive.
	while (msg.message != WM_QUIT) { //while we do not close our application
		if (PeekMessage(&msg, NULL, 0, 0, PM_REMOVE)) {
			TranslateMessage(&msg);
			DispatchMessage(&msg);
		}
		Sleep(0);
	}

	puts("Exiting.");

	// Uninstall the hooks.
	EnableHooks = false;
	UnhookWindowsHookEx(llKeyboardHook);
	UnhookWindowsHookEx(llMouseHook);

	FreeConsole();

	return 0;
}