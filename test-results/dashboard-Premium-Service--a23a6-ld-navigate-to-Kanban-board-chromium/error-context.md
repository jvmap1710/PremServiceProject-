# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Premium Service Dashboard >> should navigate to Kanban board
- Location: tests\dashboard.spec.ts:29:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('.min-w-\\[280px\\]').first()
Expected: visible
Received: hidden
Timeout:  20000ms

Call log:
  - Expect "toBeVisible" with timeout 20000ms
  - waiting for locator('.min-w-\\[280px\\]').first()
    23 × locator resolved to <div class="flex flex-col h-full min-w-[280px] md:min-w-[320px] max-w-[420px] flex-1 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm rounded-[32px] p-4 md:p-5 border border-slate-100 dark:border-slate-800/50 transition-all relative">…</div>
       - unexpected value "hidden"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e6] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e7]:
      - img [ref=e8]
    - generic [ref=e11]:
      - button "Open issues overlay" [ref=e12]:
        - generic [ref=e13]:
          - generic [ref=e14]: "0"
          - generic [ref=e15]: "1"
        - generic [ref=e16]: Issue
      - button "Collapse issues badge" [ref=e17]:
        - img [ref=e18]
  - alert [ref=e20]
  - generic [ref=e21]:
    - complementary [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e24]:
          - link "P Premium Service" [ref=e25] [cursor=pointer]:
            - /url: /
            - generic [ref=e26]: P
            - generic [ref=e27]: Premium Service
          - button "Thu gọn" [ref=e28]:
            - img [ref=e29]
        - navigation [ref=e31]:
          - link "Tổng quan" [ref=e33] [cursor=pointer]:
            - /url: /
            - img [ref=e34]
            - generic [ref=e39]: Tổng quan
          - link "Khách hàng" [ref=e41] [cursor=pointer]:
            - /url: /clients
            - img [ref=e42]
            - generic [ref=e47]: Khách hàng
          - link "Yêu cầu dịch vụ" [ref=e49] [cursor=pointer]:
            - /url: /requests
            - img [ref=e50]
            - generic [ref=e53]: Yêu cầu dịch vụ
          - link "Báo cáo & Thống kê" [ref=e55] [cursor=pointer]:
            - /url: /reports
            - img [ref=e56]
            - generic [ref=e58]: Báo cáo & Thống kê
          - generic [ref=e59]:
            - paragraph [ref=e61]: Quản trị hệ thống
            - link "Người dùng" [ref=e62] [cursor=pointer]:
              - /url: /admin/users
              - img [ref=e63]
              - generic [ref=e68]: Người dùng
          - link "Cấu hình Email" [ref=e70] [cursor=pointer]:
            - /url: /admin/settings/email
            - img [ref=e71]
            - generic [ref=e74]: Cấu hình Email
          - link "Cấu hình hệ thống" [ref=e76] [cursor=pointer]:
            - /url: /admin/settings
            - img [ref=e77]
            - generic [ref=e80]: Cấu hình hệ thống
          - paragraph [ref=e82]: Công việc của tôi
          - generic [ref=e83]: Đang tải...
    - generic [ref=e84]:
      - banner [ref=e85]:
        - generic [ref=e87]:
          - img [ref=e88]
          - textbox "Tìm kiếm yêu cầu, khách hàng..." [ref=e91]
        - generic [ref=e92]:
          - button "Chuyển đổi chế độ tối/sáng" [ref=e93]:
            - img [ref=e94]
          - button [ref=e101]:
            - img [ref=e102]
          - button "Xin chào, Admin JV (Quản trị)" [ref=e107]:
            - generic [ref=e108]:
              - paragraph [ref=e109]: Xin chào,
              - paragraph [ref=e110]:
                - text: Admin JV
                - generic [ref=e111]: (Quản trị)
            - img [ref=e113]
      - main [ref=e116]:
        - generic [ref=e117]:
          - generic [ref=e118]:
            - heading "Dashboard Overview" [level=1] [ref=e119]:
              - img [ref=e120]
              - text: Dashboard Overview
            - paragraph [ref=e125]: Hệ thống quản lý dịch vụ Premium - Tổng quan chỉ số
          - generic [ref=e126]:
            - generic [ref=e128]:
              - generic [ref=e129]:
                - paragraph [ref=e130]: Tổng Ticket
                - heading "30" [level=3] [ref=e131]
              - img [ref=e133]
            - generic [ref=e137]:
              - generic [ref=e138]:
                - paragraph [ref=e139]: Tổng giờ SRO
                - heading "308h" [level=3] [ref=e140]
              - img [ref=e142]
            - generic [ref=e146]:
              - generic [ref=e147]:
                - paragraph [ref=e148]: Đang xử lý
                - heading "0" [level=3] [ref=e149]
              - img [ref=e151]
            - generic [ref=e154]:
              - generic [ref=e155]:
                - paragraph [ref=e156]: Tỉ lệ hoàn thành
                - heading "100%" [level=3] [ref=e157]
              - img [ref=e159]
          - generic [ref=e162]:
            - generic [ref=e163]:
              - heading "Trạng thái Ticket" [level=3] [ref=e164]
              - generic [ref=e167]:
                - list [ref=e169]:
                  - listitem [ref=e170]:
                    - img "CLOSED legend icon" [ref=e171]
                    - text: CLOSED
                  - listitem [ref=e173]:
                    - img "DONE legend icon" [ref=e174]
                    - text: DONE
                  - listitem [ref=e176]:
                    - img "IN_PROGRESS legend icon" [ref=e177]
                    - text: IN_PROGRESS
                  - listitem [ref=e179]:
                    - img "PAUSED legend icon" [ref=e180]
                    - text: PAUSED
                  - listitem [ref=e182]:
                    - img "TODO legend icon" [ref=e183]
                    - text: TODO
                - application [ref=e185]
            - generic [ref=e192]:
              - heading "Phân loại Yêu cầu" [level=3] [ref=e193]
              - application [ref=e197]:
                - generic [ref=e220]:
                  - generic [ref=e221]:
                    - generic [ref=e223]: PROBLEM
                    - generic [ref=e225]: SRO
                    - generic [ref=e227]: NSRO
                    - generic [ref=e229]: HEALTH_CHECK
                  - generic [ref=e230]:
                    - generic [ref=e232]: "0"
                    - generic [ref=e234]: "2"
                    - generic [ref=e236]: "4"
                    - generic [ref=e238]: "6"
                    - generic [ref=e240]: "8"
          - generic [ref=e241]:
            - generic [ref=e242]:
              - heading "Task Management" [level=2] [ref=e243]
              - paragraph [ref=e244]: Quản lý luồng công việc hiện tại
            - generic [ref=e246]:
              - generic [ref=e247]:
                - generic [ref=e248]:
                  - generic [ref=e249]:
                    - img [ref=e250]
                    - textbox "Tìm mã hoặc tiêu đề..." [ref=e253]
                  - generic [ref=e254]:
                    - img [ref=e255]
                    - combobox [ref=e258] [cursor=pointer]:
                      - option "Khách hàng" [selected]
                      - option "BIDV-SuMi TRUST Leasing Company (BSL)"
                      - option "SMC Manufacturing (Vietnam) Co., Ltd"
                  - generic [ref=e259]:
                    - img [ref=e260]
                    - combobox [ref=e262] [cursor=pointer]:
                      - option "Loại Ticket" [selected]
                      - option "🚨 Incident (Sự cố)"
                      - option "🔍 Problem (Vấn đề)"
                      - option "📋 Standard Request (Yêu cầu tiêu chuẩn)"
                      - option "⚡ Non-Standard Request (Yêu cầu phi tiêu chuẩn)"
                      - option "⚙️ Others (Khác)"
                      - option "🩺 Health Check (Kiểm tra định kỳ)"
                  - button "Việc của tôi" [ref=e263]:
                    - img [ref=e264]
                    - generic [ref=e268]: Việc của tôi
                - button "Thêm cột" [ref=e269]:
                  - img [ref=e270]
                  - generic [ref=e271]: Thêm cột
              - generic [ref=e272]:
                - generic [ref=e273]:
                  - generic [ref=e275]:
                    - generic [ref=e276]:
                      - generic:
                        - generic:
                          - button "Đổi màu":
                            - img
                          - button "Sửa tên":
                            - img
                      - generic [ref=e277]:
                        - generic "Đổi màu danh mục" [ref=e278] [cursor=pointer]
                        - heading "Mới" [level=3] [ref=e279]
                      - generic [ref=e280]:
                        - button [ref=e281]:
                          - img [ref=e282]
                        - generic [ref=e283]: "0"
                    - paragraph [ref=e286]: Chưa có dữ liệu
                  - generic [ref=e288]:
                    - generic [ref=e289]:
                      - generic:
                        - generic:
                          - button "Đổi màu":
                            - img
                          - button "Sửa tên":
                            - img
                      - generic [ref=e290]:
                        - generic "Đổi màu danh mục" [ref=e291] [cursor=pointer]
                        - heading "Đang xử lý" [level=3] [ref=e292]
                      - generic [ref=e294]: "0"
                    - paragraph [ref=e297]: Chưa có dữ liệu
                  - generic [ref=e299]:
                    - generic [ref=e300]:
                      - generic:
                        - generic:
                          - button "Đổi màu":
                            - img
                          - button "Sửa tên":
                            - img
                      - generic [ref=e301]:
                        - generic "Đổi màu danh mục" [ref=e302] [cursor=pointer]
                        - heading "Hoàn thành" [level=3] [ref=e303]
                      - generic [ref=e305]: "10"
                    - generic [ref=e306]:
                      - 'button "Vừa 20/05 · Hôm nay! SMC-030 Exceeds SRO Hỗ trợ Premium định kỳ - Lần 30 SMC Manufacturing (Vietnam) Co., Ltd Tạo bởi: Admin JV A Admin JV 16.3h / 16.0h" [ref=e307]':
                        - generic [ref=e308]:
                          - generic [ref=e310]:
                            - generic [ref=e311]:
                              - img [ref=e312]
                              - generic [ref=e313]: Vừa
                            - generic [ref=e314]:
                              - img [ref=e315]
                              - generic [ref=e317]: 20/05
                              - generic [ref=e318]: · Hôm nay!
                          - generic [ref=e319]:
                            - generic [ref=e320]:
                              - generic [ref=e321]:
                                - img [ref=e323]
                                - generic [ref=e326]: SMC-030
                              - generic [ref=e327]: Exceeds SRO
                            - heading "Hỗ trợ Premium định kỳ - Lần 30" [level=4] [ref=e328]
                            - generic [ref=e329]:
                              - generic [ref=e330]:
                                - img [ref=e331]
                                - generic [ref=e334]: SMC Manufacturing (Vietnam) Co., Ltd
                              - generic [ref=e336]: "Tạo bởi: Admin JV"
                            - generic [ref=e337]:
                              - generic [ref=e338]:
                                - generic [ref=e340]: A
                                - generic [ref=e341]: Admin JV
                              - generic [ref=e342]:
                                - img [ref=e343]
                                - generic [ref=e346]: 16.3h / 16.0h
                      - 'button "Vừa 13/05 · Còn -7n BSL-029 Hỗ trợ Premium định kỳ - Lần 29 BIDV-SuMi TRUST Leasing Company (BSL) Tạo bởi: Admin JV K Kỹ thuật viên 02 3.7h / 4.0h" [ref=e347]':
                        - generic [ref=e348]:
                          - generic [ref=e350]:
                            - generic [ref=e351]:
                              - img [ref=e352]
                              - generic [ref=e353]: Vừa
                            - generic [ref=e354]:
                              - img [ref=e355]
                              - generic [ref=e357]: 13/05
                              - generic [ref=e358]: · Còn -7n
                          - generic [ref=e359]:
                            - generic [ref=e361]:
                              - img [ref=e363]
                              - generic [ref=e366]: BSL-029
                            - heading "Hỗ trợ Premium định kỳ - Lần 29" [level=4] [ref=e367]
                            - generic [ref=e368]:
                              - generic [ref=e369]:
                                - img [ref=e370]
                                - generic [ref=e373]: BIDV-SuMi TRUST Leasing Company (BSL)
                              - generic [ref=e375]: "Tạo bởi: Admin JV"
                            - generic [ref=e376]:
                              - generic [ref=e377]:
                                - generic [ref=e379]: K
                                - generic [ref=e380]: Kỹ thuật viên 02
                              - generic [ref=e381]:
                                - img [ref=e382]
                                - generic [ref=e385]: 3.7h / 4.0h
                      - 'button "Vừa 06/05 · Còn -14n SMC-028 Exceeds SRO Hỗ trợ Premium định kỳ - Lần 28 SMC Manufacturing (Vietnam) Co., Ltd Tạo bởi: Admin JV K Kỹ thuật viên 01 4.4h / 4.0h" [ref=e386]':
                        - generic [ref=e387]:
                          - generic [ref=e389]:
                            - generic [ref=e390]:
                              - img [ref=e391]
                              - generic [ref=e392]: Vừa
                            - generic [ref=e393]:
                              - img [ref=e394]
                              - generic [ref=e396]: 06/05
                              - generic [ref=e397]: · Còn -14n
                          - generic [ref=e398]:
                            - generic [ref=e399]:
                              - generic [ref=e400]:
                                - img [ref=e402]
                                - generic [ref=e405]: SMC-028
                              - generic [ref=e406]: Exceeds SRO
                            - heading "Hỗ trợ Premium định kỳ - Lần 28" [level=4] [ref=e407]
                            - generic [ref=e408]:
                              - generic [ref=e409]:
                                - img [ref=e410]
                                - generic [ref=e413]: SMC Manufacturing (Vietnam) Co., Ltd
                              - generic [ref=e415]: "Tạo bởi: Admin JV"
                            - generic [ref=e416]:
                              - generic [ref=e417]:
                                - generic [ref=e419]: K
                                - generic [ref=e420]: Kỹ thuật viên 01
                              - generic [ref=e421]:
                                - img [ref=e422]
                                - generic [ref=e425]: 4.4h / 4.0h
                      - 'button "Vừa 20/04 · Còn -30n BSL-027 Exceeds SRO Hỗ trợ Premium định kỳ - Lần 27 BIDV-SuMi TRUST Leasing Company (BSL) Tạo bởi: Admin JV A Admin JV 12.3h / 12.0h" [ref=e426]':
                        - generic [ref=e427]:
                          - generic [ref=e429]:
                            - generic [ref=e430]:
                              - img [ref=e431]
                              - generic [ref=e432]: Vừa
                            - generic [ref=e433]:
                              - img [ref=e434]
                              - generic [ref=e436]: 20/04
                              - generic [ref=e437]: · Còn -30n
                          - generic [ref=e438]:
                            - generic [ref=e439]:
                              - generic [ref=e440]:
                                - img [ref=e442]
                                - generic [ref=e445]: BSL-027
                              - generic [ref=e446]: Exceeds SRO
                            - heading "Hỗ trợ Premium định kỳ - Lần 27" [level=4] [ref=e447]
                            - generic [ref=e448]:
                              - generic [ref=e449]:
                                - img [ref=e450]
                                - generic [ref=e453]: BIDV-SuMi TRUST Leasing Company (BSL)
                              - generic [ref=e455]: "Tạo bởi: Admin JV"
                            - generic [ref=e456]:
                              - generic [ref=e457]:
                                - generic [ref=e459]: A
                                - generic [ref=e460]: Admin JV
                              - generic [ref=e461]:
                                - img [ref=e462]
                                - generic [ref=e465]: 12.3h / 12.0h
                      - 'button "Vừa 13/04 · Còn -37n SMC-026 Exceeds SRO Hỗ trợ Premium định kỳ - Lần 26 SMC Manufacturing (Vietnam) Co., Ltd Tạo bởi: Admin JV K Kỹ thuật viên 02 4.2h / 4.0h" [ref=e466]':
                        - generic [ref=e467]:
                          - generic [ref=e469]:
                            - generic [ref=e470]:
                              - img [ref=e471]
                              - generic [ref=e472]: Vừa
                            - generic [ref=e473]:
                              - img [ref=e474]
                              - generic [ref=e476]: 13/04
                              - generic [ref=e477]: · Còn -37n
                          - generic [ref=e478]:
                            - generic [ref=e479]:
                              - generic [ref=e480]:
                                - img [ref=e482]
                                - generic [ref=e485]: SMC-026
                              - generic [ref=e486]: Exceeds SRO
                            - heading "Hỗ trợ Premium định kỳ - Lần 26" [level=4] [ref=e487]
                            - generic [ref=e488]:
                              - generic [ref=e489]:
                                - img [ref=e490]
                                - generic [ref=e493]: SMC Manufacturing (Vietnam) Co., Ltd
                              - generic [ref=e495]: "Tạo bởi: Admin JV"
                            - generic [ref=e496]:
                              - generic [ref=e497]:
                                - generic [ref=e499]: K
                                - generic [ref=e500]: Kỹ thuật viên 02
                              - generic [ref=e501]:
                                - img [ref=e502]
                                - generic [ref=e505]: 4.2h / 4.0h
                      - 'button "Vừa 06/04 · Còn -44n BSL-025 Hỗ trợ Premium định kỳ - Lần 25 BIDV-SuMi TRUST Leasing Company (BSL) Tạo bởi: Admin JV K Kỹ thuật viên 01 3.7h / 4.0h" [ref=e506]':
                        - generic [ref=e507]:
                          - generic [ref=e509]:
                            - generic [ref=e510]:
                              - img [ref=e511]
                              - generic [ref=e512]: Vừa
                            - generic [ref=e513]:
                              - img [ref=e514]
                              - generic [ref=e516]: 06/04
                              - generic [ref=e517]: · Còn -44n
                          - generic [ref=e518]:
                            - generic [ref=e520]:
                              - img [ref=e522]
                              - generic [ref=e525]: BSL-025
                            - heading "Hỗ trợ Premium định kỳ - Lần 25" [level=4] [ref=e526]
                            - generic [ref=e527]:
                              - generic [ref=e528]:
                                - img [ref=e529]
                                - generic [ref=e532]: BIDV-SuMi TRUST Leasing Company (BSL)
                              - generic [ref=e534]: "Tạo bởi: Admin JV"
                            - generic [ref=e535]:
                              - generic [ref=e536]:
                                - generic [ref=e538]: K
                                - generic [ref=e539]: Kỹ thuật viên 01
                              - generic [ref=e540]:
                                - img [ref=e541]
                                - generic [ref=e544]: 3.7h / 4.0h
                      - 'button "Vừa 20/03 · Còn -61n SMC-024 Exceeds SRO Hỗ trợ Premium định kỳ - Lần 24 SMC Manufacturing (Vietnam) Co., Ltd Tạo bởi: Admin JV A Admin JV 27.7h / 24.0h" [ref=e545]':
                        - generic [ref=e546]:
                          - generic [ref=e548]:
                            - generic [ref=e549]:
                              - img [ref=e550]
                              - generic [ref=e551]: Vừa
                            - generic [ref=e552]:
                              - img [ref=e553]
                              - generic [ref=e555]: 20/03
                              - generic [ref=e556]: · Còn -61n
                          - generic [ref=e557]:
                            - generic [ref=e558]:
                              - generic [ref=e559]:
                                - img [ref=e561]
                                - generic [ref=e564]: SMC-024
                              - generic [ref=e565]: Exceeds SRO
                            - heading "Hỗ trợ Premium định kỳ - Lần 24" [level=4] [ref=e566]
                            - generic [ref=e567]:
                              - generic [ref=e568]:
                                - img [ref=e569]
                                - generic [ref=e572]: SMC Manufacturing (Vietnam) Co., Ltd
                              - generic [ref=e574]: "Tạo bởi: Admin JV"
                            - generic [ref=e575]:
                              - generic [ref=e576]:
                                - generic [ref=e578]: A
                                - generic [ref=e579]: Admin JV
                              - generic [ref=e580]:
                                - img [ref=e581]
                                - generic [ref=e584]: 27.7h / 24.0h
                      - 'button "Vừa 13/03 · Còn -68n BSL-023 Hỗ trợ Premium định kỳ - Lần 23 BIDV-SuMi TRUST Leasing Company (BSL) Tạo bởi: Admin JV K Kỹ thuật viên 02 3.4h / 4.0h" [ref=e585]':
                        - generic [ref=e586]:
                          - generic [ref=e588]:
                            - generic [ref=e589]:
                              - img [ref=e590]
                              - generic [ref=e591]: Vừa
                            - generic [ref=e592]:
                              - img [ref=e593]
                              - generic [ref=e595]: 13/03
                              - generic [ref=e596]: · Còn -68n
                          - generic [ref=e597]:
                            - generic [ref=e599]:
                              - img [ref=e601]
                              - generic [ref=e604]: BSL-023
                            - heading "Hỗ trợ Premium định kỳ - Lần 23" [level=4] [ref=e605]
                            - generic [ref=e606]:
                              - generic [ref=e607]:
                                - img [ref=e608]
                                - generic [ref=e611]: BIDV-SuMi TRUST Leasing Company (BSL)
                              - generic [ref=e613]: "Tạo bởi: Admin JV"
                            - generic [ref=e614]:
                              - generic [ref=e615]:
                                - generic [ref=e617]: K
                                - generic [ref=e618]: Kỹ thuật viên 02
                              - generic [ref=e619]:
                                - img [ref=e620]
                                - generic [ref=e623]: 3.4h / 4.0h
                      - 'button "Vừa 06/03 · Còn -75n SMC-022 Exceeds SRO Hỗ trợ Premium định kỳ - Lần 22 SMC Manufacturing (Vietnam) Co., Ltd Tạo bởi: Admin JV K Kỹ thuật viên 01 4.8h / 4.0h" [ref=e624]':
                        - generic [ref=e625]:
                          - generic [ref=e627]:
                            - generic [ref=e628]:
                              - img [ref=e629]
                              - generic [ref=e630]: Vừa
                            - generic [ref=e631]:
                              - img [ref=e632]
                              - generic [ref=e634]: 06/03
                              - generic [ref=e635]: · Còn -75n
                          - generic [ref=e636]:
                            - generic [ref=e637]:
                              - generic [ref=e638]:
                                - img [ref=e640]
                                - generic [ref=e643]: SMC-022
                              - generic [ref=e644]: Exceeds SRO
                            - heading "Hỗ trợ Premium định kỳ - Lần 22" [level=4] [ref=e645]
                            - generic [ref=e646]:
                              - generic [ref=e647]:
                                - img [ref=e648]
                                - generic [ref=e651]: SMC Manufacturing (Vietnam) Co., Ltd
                              - generic [ref=e653]: "Tạo bởi: Admin JV"
                            - generic [ref=e654]:
                              - generic [ref=e655]:
                                - generic [ref=e657]: K
                                - generic [ref=e658]: Kỹ thuật viên 01
                              - generic [ref=e659]:
                                - img [ref=e660]
                                - generic [ref=e663]: 4.8h / 4.0h
                      - 'button "Cao 20/02 · Còn -89n BSL-021 Exceeds SRO Hỗ trợ Premium định kỳ - Lần 21 BIDV-SuMi TRUST Leasing Company (BSL) Tạo bởi: Admin JV A Admin JV 4.5h / 4.0h" [ref=e664]':
                        - generic [ref=e665]:
                          - generic [ref=e667]:
                            - generic [ref=e668]:
                              - img [ref=e669]
                              - generic [ref=e671]: Cao
                            - generic [ref=e672]:
                              - img [ref=e673]
                              - generic [ref=e675]: 20/02
                              - generic [ref=e676]: · Còn -89n
                          - generic [ref=e677]:
                            - generic [ref=e678]:
                              - generic [ref=e679]:
                                - img [ref=e681]
                                - generic [ref=e684]: BSL-021
                              - generic [ref=e685]: Exceeds SRO
                            - heading "Hỗ trợ Premium định kỳ - Lần 21" [level=4] [ref=e686]
                            - generic [ref=e687]:
                              - generic [ref=e688]:
                                - img [ref=e689]
                                - generic [ref=e692]: BIDV-SuMi TRUST Leasing Company (BSL)
                              - generic [ref=e694]: "Tạo bởi: Admin JV"
                            - generic [ref=e695]:
                              - generic [ref=e696]:
                                - generic [ref=e698]: A
                                - generic [ref=e699]: Admin JV
                              - generic [ref=e700]:
                                - img [ref=e701]
                                - generic [ref=e704]: 4.5h / 4.0h
                  - generic [ref=e706]:
                    - generic [ref=e707]:
                      - generic:
                        - generic:
                          - button "Đổi màu":
                            - img
                          - button "Sửa tên":
                            - img
                          - button "Xóa cột":
                            - img
                      - generic [ref=e708]:
                        - generic "Đổi màu danh mục" [ref=e709] [cursor=pointer]
                        - heading "Tạm ngưng" [level=3] [ref=e710]
                      - generic [ref=e712]: "0"
                    - paragraph [ref=e715]: Chưa có dữ liệu
                  - generic [ref=e717]:
                    - generic [ref=e718]:
                      - generic:
                        - generic:
                          - button "Đổi màu":
                            - img
                          - button "Sửa tên":
                            - img
                          - button "Xóa cột":
                            - img
                      - generic [ref=e719]:
                        - generic "Đổi màu danh mục" [ref=e720] [cursor=pointer]
                        - heading "Đóng" [level=3] [ref=e721]
                      - generic [ref=e723]: "0"
                    - paragraph [ref=e726]: Chưa có dữ liệu
                - status [ref=e727]
  - generic [ref=e728]: "0"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Premium Service Dashboard', () => {
  4  |   test('should login and display dashboard stats', async ({ page }) => {
  5  |     // Tăng timeout cho toàn bộ test này
  6  |     test.setTimeout(60000);
  7  | 
  8  |     await page.goto('/');
  9  |     
  10 |     // Đợi ô nhập liệu xuất hiện thay vì đợi network
  11 |     if (page.url().includes('/login')) {
  12 |       await page.waitForSelector('input[name="username"]');
  13 |       await page.fill('input[name="username"]', 'JV');
  14 |       await page.fill('input[name="password"]', 'MotSys123@');
  15 |       await page.click('button[type="submit"]');
  16 |     }
  17 | 
  18 |     // Đợi đúng cái tiêu đề Dashboard hiện ra
  19 |     await expect(page.locator('h1')).toContainText('Dashboard Overview', { timeout: 30000 });
  20 |     
  21 |     // Đợi các thẻ thống kê hiện ra
  22 |     await expect(page.locator('text=Tổng Ticket')).toBeVisible({ timeout: 15000 });
  23 |     
  24 |     // Kiểm tra biểu đồ
  25 |     const charts = page.locator('.recharts-responsive-container');
  26 |     await expect(charts).toHaveCount(2);
  27 |   });
  28 | 
  29 |   test('should navigate to Kanban board', async ({ page }) => {
  30 |     test.setTimeout(60000);
  31 |     await page.goto('/');
  32 |     
  33 |     if (page.url().includes('/login')) {
  34 |       await page.fill('input[name="username"]', 'JV');
  35 |       await page.fill('input[name="password"]', 'MotSys123@');
  36 |       await page.click('button[type="submit"]');
  37 |     }
  38 | 
  39 |     // Đợi Dashboard load xong
  40 |     await expect(page.locator('h1')).toContainText('Dashboard Overview', { timeout: 30000 });
  41 |     
  42 |     await page.locator('text=Task Management').scrollIntoViewIfNeeded();
  43 |     
  44 |     // Đợi cột Kanban xuất hiện
> 45 |     await expect(page.locator('.min-w-\\[280px\\]').first()).toBeVisible({ timeout: 20000 });
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  46 |   });
  47 | });
  48 | 
```