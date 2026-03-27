// @ts-nocheck
export default function (req: any, res: any) {
    res.status(200).json({
        status: 'debug',
        message: 'Minimal API working',
        env: process.env.NODE_ENV
    });
}
