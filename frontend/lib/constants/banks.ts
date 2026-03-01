export interface Bank {
    name: string;
    code: string;
    shortName: string;
}

export const VIETNAM_BANKS: Bank[] = [
    { name: 'Ngân hàng TMCP An Bình (ABBANK)', code: '970425', shortName: 'ABB' },
    { name: 'Ngân hàng TMCP Á Châu (ACB)', code: '970416', shortName: 'ACB' },
    { name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)', code: '970405', shortName: 'VBA' },
    { name: 'Ngân hàng TMCP Bắc Á (Bac A Bank)', code: '970409', shortName: 'NASB' },
    { name: 'Ngân hàng TMCP Bảo Việt (BaoViet Bank)', code: '970438', shortName: 'BVB' },
    { name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)', code: '970418', shortName: 'BID' },
    { name: 'Ngân hàng TMCP Đông Á (DongA Bank)', code: '970406', shortName: 'DOB' },
    { name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam (Eximbank)', code: '970431', shortName: 'EIB' },
    { name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh (HDBank)', code: '970437', shortName: 'HDB' },
    { name: 'Ngân hàng TMCP Công thương Việt Nam (VietinBank)', code: '970415', shortName: 'CTG' },
    { name: 'Ngân hàng TMCP Kiên Long (Kienlongbank)', code: '970452', shortName: 'KLB' },
    { name: 'Ngân hàng TMCP Bưu Điện Liên Việt (LienVietPostBank)', code: '970449', shortName: 'LPB' },
    { name: 'Ngân hàng TMCP Quân đội (MBBank)', code: '970422', shortName: 'MBB' },
    { name: 'Ngân hàng TMCP Hàng Hải Việt Nam (MSB)', code: '970426', shortName: 'MSB' },
    { name: 'Ngân hàng TMCP Nam Á (Nam A Bank)', code: '970428', shortName: 'NAB' },
    { name: 'Ngân hàng TMCP Quốc Dân (NCB)', code: '970419', shortName: 'NCB' },
    { name: 'Ngân hàng TMCP Phương Đông (OCB)', code: '970448', shortName: 'OCB' },
    { name: 'Ngân hàng TMCP Xăng dầu Petrolimex (PGBank)', code: '970430', shortName: 'PGB' },
    { name: 'Ngân hàng TMCP Đại Chúng Việt Nam (PVcomBank)', code: '970412', shortName: 'PVC' },
    { name: 'Ngân hàng TMCP Sài Gòn (SCB)', code: '970429', shortName: 'SCB' },
    { name: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)', code: '970403', shortName: 'STB' },
    { name: 'Ngân hàng TMCP Đông Nam Á (SeABank)', code: '970440', shortName: 'SEA' },
    { name: 'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)', code: '970443', shortName: 'SHB' },
    { name: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)', code: '970407', shortName: 'TCB' },
    { name: 'Ngân hàng TMCP Tiên Phong (TPBank)', code: '970423', shortName: 'TPB' },
    { name: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)', code: '970436', shortName: 'VCB' },
    { name: 'Ngân hàng TMCP Bản Việt (Viet Capital Bank)', code: '970454', shortName: 'BVB' },
    { name: 'Ngân hàng TMCP Việt Nam Thương Tín (Vietbank)', code: '970433', shortName: 'VBB' },
    { name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)', code: '970432', shortName: 'VPB' },
    { name: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)', code: '970441', shortName: 'VIB' },
].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
